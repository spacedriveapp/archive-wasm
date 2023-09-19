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
 * @typicalname fs
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { extract, WARNING } from './archive.mjs'

/**
 * Extract all supported archive entries inside a given path
 *
 * > Only files, directories, symlinks and hardlinks are supported.
 *   Any extra entry type, or invalid entry, in the archive will be skipped (with a warning printed to console)
 *   This function throws if it attempts to overwrite any existing file
 * @param {ArrayBufferLike} data Archive's data
 * @param {string} out Path where the archive entries will be extracted to
 * @param {string} [passphrase] Passphrase to decrypt protect zip archives
 */
export async function extractTo(data, out, passphrase) {
  if (
    !fs.stat(out).then(
      stat => stat.isDirectory(),
      () => false
    )
  )
    throw new Error("Output path isn't a valid directory")

  const ops = []

  /**
   * @private
   * @type {Record.<string, import('./archive.mjs').Entry>}
   */
  const hardlinks = {}

  for (const entry of extract(data, passphrase)) {
    let entryPath = path.relative(out, path.resolve(out, entry.path))
    if (!entryPath || entryPath.startsWith('..') || path.isAbsolute(entryPath)) {
      if (WARNING)
        console.warn(
          `Entry has a path the goes outside the request out dir: ${entry.path}, skipping...`
        )
      continue
    }

    entryPath = path.resolve(out, entry.path)

    switch (entry.type) {
      case 'SYMBOLIC_LINK':
        ops.push(
          (async () => {
            if (entry.link == null) {
              if (WARNING) console.warn(`Invalid symlink: ${entry.path}, skiping...`)
              return
            }
            await fs.symlink(entry.link, entryPath, 'junction')
            // While this is deprecated, it calls open & fchmod under the hood, which is the right approach
            // so keep using it to avoid having to deel with open ourselfs
            await fs.lchmod(entryPath, entry.perm)
            await fs.lutimes(entryPath, String(entry.atime), String(entry.mtime))
          })()
        )
        break
      case 'DIR':
        ops.push(
          (async () => {
            await fs.mkdir(entryPath, { mode: entry.perm, recursive: true })
            await fs.utimes(entryPath, String(entry.atime), String(entry.mtime))
          })()
        )
        break
      case 'FILE': {
        const data = entry.data
        ops.push(
          (async () => {
            await fs.writeFile(entryPath, Buffer.from(data), { mode: entry.perm, flag: 'wx+' })
            await fs.utimes(entryPath, String(entry.atime), String(entry.mtime))
          })()
        )
        break
      }
      case null:
        hardlinks[entryPath] = entry
        break
      default:
        if (WARNING) console.warn(`Unsupported entry type: ${entry.type}, skiping...`)
        break
    }
  }

  await Promise.all(ops)
  await Promise.all(
    Object.entries(hardlinks).map(async ([entryPath, entry]) => {
      if (entry.link === null) {
        if (WARNING) console.warn(`Invalid hardlink: ${entry.path}, skiping...`)
        return
      }
      await fs.link(entry.link, entryPath)
      await fs.chmod(entryPath, entry.perm)
      await fs.utimes(entryPath, String(entry.atime), String(entry.mtime))
    })
  )
}
