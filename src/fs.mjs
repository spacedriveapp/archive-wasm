/*!
 * archive-wasm - LibArchive compiled to WASM with a idiomatic JS API
 * Copyright (C) 2023 Spacedrive Technology Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * @file Utilities for extracting archives to disk using NodeJS's fs API
 * @module archive-wasm/src/fs.mjs
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { extractAll } from './archive.mjs'
import { WARNING } from './wasm/bridge.mjs'

const untrue = () => false

/**
 * Check if file not found error
 * @private
 * @param {unknown} error Error
 * @returns {boolean} Whether it is file not found
 */
function isENOENT(error) {
  return error != null && typeof error === 'object' && 'code' in error && error.code === 'ENOENT'
}

/**
 * https://github.com/nodejs/node/blob/v20.7.0/lib/internal/fs/promises.js#L930-L936
 * @private
 * @param {string} path Symlink path
 * @param {number} mode New permissions
 * @returns {Promise<void>} Fulfills with `undefined` upon success.
 */
async function fchmod(path, mode) {
  if (fs.constants.O_SYMLINK == null) return

  const fd = await fs.open(path, fs.constants.O_WRONLY | fs.constants.O_SYMLINK)
  try {
    return await fd.chmod(mode)
  } finally {
    await fd.close()
  }
}

/**
 * @private
 * @param {string} dirPath Entry's path
 * @param {number} perm Entry's perm
 * @param {bigint} atime Entry's atime
 * @param {bigint} mtime Entry's mtime
 */
async function mkdir(dirPath, perm, atime, mtime) {
  await fs.mkdir(dirPath, { mode: perm, recursive: true })
  // Ensure permissions are set, because dir could have been create by another call
  await fs.chmod(dirPath, perm)

  try {
    await fs.utimes(dirPath, String(atime), String(mtime))
  } catch (error) {
    if (WARNING) console.warn(`Failed to update symlink metadata: ${dirPath}`, error)
  }
}

/**
 * @private
 * @param {string} filePath Symlink path
 * @param {string} link Target path
 * @param {number} perm Symlink perm
 * @param {bigint} atime Symlink atime
 * @param {bigint} mtime Symlink mtime
 * @param {boolean} overwrite Whether the symlink should be overwritten
 */
async function symlink(filePath, link, perm, atime, mtime, overwrite) {
  if (overwrite)
    try {
      await fs.unlink(filePath)
    } catch (error) {
      if (!isENOENT(error)) throw error
    }

  await fs.mkdir(path.dirname(filePath), { mode: 0o751, recursive: true })

  let symlinkType
  if (
    process.platform === 'win32' &&
    (await fs.lstat(link).then(linkStat => linkStat.isDirectory(), untrue))
  ) {
    symlinkType = 'junction'
  }

  await fs.symlink(link, filePath, symlinkType)

  try {
    await fchmod(filePath, perm)
    await fs.lutimes(filePath, String(atime), String(mtime))
  } catch (error) {
    if (WARNING) console.warn(`Failed to update symlink metadata: ${filePath}`, error)
  }
}

/**
 * @private
 * @param {string} filePath Symlink path
 * @param {string} link Target path
 * @param {number} perm Symlink perm
 * @param {bigint} atime Symlink atime
 * @param {bigint} mtime Symlink mtime
 * @param {boolean} overwrite Whether the symlink should be overwritten
 */
async function hardlink(filePath, link, perm, atime, mtime, overwrite) {
  if (overwrite)
    try {
      await fs.unlink(filePath)
    } catch (error) {
      if (!isENOENT(error)) throw error
    }
  await fs.mkdir(path.dirname(filePath), { mode: 0o751, recursive: true })
  await fs.link(link, filePath)

  try {
    await fs.chmod(filePath, perm)
    await fs.utimes(filePath, String(atime), String(mtime))
  } catch (error) {
    if (WARNING) console.warn(`Failed to update hardlink metadata: ${filePath}`, error)
  }
}

/**
 * @private
 * @param {string} filePath File path
 * @param {ArrayBufferLike} data File data to be written
 * @param {number} perm File perm
 * @param {bigint} atime File atime
 * @param {bigint} mtime File mtime
 * @param {boolean} overwrite Whether the file should be overwritten
 */
async function writeFile(filePath, data, perm, atime, mtime, overwrite) {
  await fs.mkdir(path.dirname(filePath), { mode: 0o751, recursive: true })
  await fs.writeFile(filePath, Buffer.from(data), {
    mode: perm,
    flag: overwrite ? 'w+' : 'wx+',
  })

  try {
    await fs.utimes(filePath, String(atime), String(mtime))
  } catch (error) {
    if (WARNING) console.warn(`Failed to update symlink metadata: ${filePath}`, error)
  }
}

/**
 * Exclusive options for {@link extractTo}
 * @typedef {object} ExtractToExclusiveOpts
 * @property {number} [chmod] Permission flag to be AND'ed to all extracted entires permissions (The oposite of umask)
 * @property {boolean} [overwrite] Allow overwriting files
 * @property {bigint?} [sizeLimit] Limit the total byte size of data to be extracted to avoid memory exhaustion, null means no limit (default: 128MB)
 */

/**
 * Options for {@link extractTo}
 * @typedef {import("./archive.mjs").ExtractAllOpts & ExtractToExclusiveOpts} ExtractToOpts
 */

/**
 * Extract all supported archive entries inside a given path
 * > Only files, directories, symlinks and hardlinks are supported.
 *   Any extra entry type, or invalid entry, in the archive will be skipped (with a warning printed to console)
 *   This function throws if it attempts to overwrite any existing file
 * @param {ArrayBufferLike} data Archive's data
 * @param {string} out Path where the archive entries will be extracted to
 * @param {string | ExtractToOpts} [opts] Extract options, string value will be interpreted as password
 */
export async function extractTo(data, out, opts) {
  if (
    !(await fs.stat(out).then(
      stat => stat.isDirectory(),
      () => false
    ))
  )
    throw new Error("Output path isn't a valid directory")

  let chmod = 0
  let overwrite = false
  if (opts && typeof opts === 'object') {
    if (opts.chmod != null) chmod = opts.chmod
    if (opts.overwrite != null) overwrite = opts.overwrite
    opts.ignoreDotDir = true
  }

  for (const entry of extractAll(data, opts)) {
    if (entry.path == null) {
      if (WARNING) console.warn('Ignoring empty path entry')
      continue
    }

    let entryPath = path.relative(out, path.resolve(out, entry.path))
    if (!entryPath || entryPath.startsWith('..') || path.isAbsolute(entryPath)) {
      if (WARNING)
        console.warn(
          `Entry has a path the goes outside the request out dir: ${entry.path}, skipping...`
        )
      continue
    }
    entryPath = path.resolve(out, entry.path)

    const perms = entry.perm | chmod
    switch (entry.type) {
      case null:
        if (entry.link === null) {
          if (WARNING) console.warn(`Invalid hardlink: ${entry.path}, skiping...`)
        } else {
          await hardlink(entryPath, entry.link, perms, entry.atime, entry.mtime, overwrite)
        }
        break
      case 'DIR':
        await mkdir(entryPath, perms, entry.atime, entry.mtime)
        break
      case 'FILE': {
        await writeFile(entryPath, entry.data, perms, entry.atime, entry.mtime, overwrite)
        break
      }
      case 'SYMBOLIC_LINK':
        if (entry.link == null) {
          if (WARNING) console.warn(`Invalid symlink: ${entry.path}, skiping...`)
        } else {
          await symlink(entryPath, entry.link, perms, entry.atime, entry.mtime, overwrite)
        }
        break
      default:
        if (WARNING) console.warn(`Unsupported entry type: ${entry.type}, skiping...`)
        break
    }
  }
}
