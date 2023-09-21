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
 * @file Idiomatic JavaScript API for extracting most archive files with LibArchive
 * @module archive-wasm
 * @typicalname archive
 */

import {
  openArchive,
  getFileData,
  getEntrySize,
  closeArchive,
  getNextEntry,
  getEntryMode,
  getEntryAtime,
  getEntryMtime,
  getEntryCtime,
  getEntryPathName,
  getEntryBirthtime,
  getEntrySymlink,
  getEntryHardlink,
} from './wasm/bridge.mjs'
import { EntryTypeName, FILETYPE_FLAG } from './wasm/enums.mjs'
import { ENULL, NullError, FileReadError } from './wasm/errors.mjs'
import { Pointer } from './wasm/pointer.mjs'

/**
 * A compressed data entry inside an archive
 * @typedef {object} Entry
 * @property {bigint} size Size of the entry in bytes.
 * @property {number} perm A bit-field describing the file type and mode.
 * @property {string} path Path of the entry within the archive.
 * @property {import('./wasm/enums.mjs').EntryTypeName?} type Indicates if the entry is a file, directory or something else
 * @property {string?} link path to actual resource in case this is a symlink or hardlink
 * @property {bigint} atime The timestamp indicating the last time this file was accessed expressed in nanoseconds since the POSIX Epoch.
 * @property {bigint} ctime The timestamp indicating the last time the file status was changed expressed in nanoseconds since the POSIX Epoch.
 * @property {bigint} mtime The timestamp indicating the last time this file was modified expressed in nanoseconds since the POSIX Epoch.
 * @property {bigint} birthtime The timestamp indicating the creation time of this file expressed in nanoseconds since the POSIX Epoch.
 * @property {ArrayBufferLike} data An `ArrayBuffer` containing the entry's data.
 */

/**
 * Options for {@link extract}
 * @typedef {object} ExtractOpts
 * @property {string} [passphrase] Passphrase to decrypt protect zip archives.
 * @property {boolean} [ignoreDotDir=true] Ignore entries for '.' dir
 */

/**
 * @private
 * @type {boolean}
 */
export let WARNING = true

/** Disable lib warnings */
export function disableWarning() {
  WARNING = false
}

/**
 * Uncompress archive and iterate through all it's entries
 * @param {ArrayBufferLike} data Archive's data
 * @param {string | ExtractOpts} [opts] Extract options, string value will be interpreted as password
 * @yields {Entry}
 * @returns {Generator.<Entry, void, void>} Generator that iterate through all of the archive's entries
 */
export function* extract(data, opts) {
  let offset = -1
  /** @type {string | undefined} */
  let passphrase
  let ignoreDotDir = true
  if (opts) {
    if (typeof opts === 'string') passphrase = opts
    if (typeof opts === 'object') {
      if (opts.passphrase) passphrase = opts.passphrase
      if (opts.ignoreDotDir != null) ignoreDotDir = opts.ignoreDotDir
    }
  }

  const buffer = new Pointer().fill(data, true)
  const archive = openArchive(buffer, passphrase)

  try {
    while (true) {
      offset++
      let pointer

      try {
        pointer = getNextEntry(archive)
      } catch (error) {
        // Null here means archive EOF
        if (error instanceof NullError) return

        throw error
      }

      const mode = getEntryMode(pointer)

      // Cache the current archive so it can be modified by the getter
      let $archive = archive

      /** @type {Entry} */
      const entry = {
        perm: ~FILETYPE_FLAG & mode,
        size: getEntrySize(pointer),
        path: getEntryPathName(pointer),
        type: EntryTypeName[FILETYPE_FLAG & mode] ?? null,
        link: getEntrySymlink(pointer) || getEntryHardlink(pointer) || null,
        atime: getEntryAtime(pointer),
        ctime: getEntryCtime(pointer),
        mtime: getEntryMtime(pointer),
        birthtime: getEntryBirthtime(pointer),

        get data() {
          const data = getFileData($archive, entry.size)

          // Replace the getter with the actual value now that we got it
          Object.defineProperty(entry, 'data', { value: data })
          return data
        },
      }

      if (
        ignoreDotDir &&
        entry.path.substring(entry.path.lastIndexOf('/') + 1) === '.' &&
        entry.type === 'DIR'
      )
        continue

      yield entry

      // If getter still exists that means the entry's data was not accessed.
      const entryDataGetter = Object.getOwnPropertyDescriptor(entry, 'data')?.get
      if (typeof entryDataGetter === 'function') {
        let skips = offset + 1

        // Replace the getter with one that opens a new archive to work-around the streaming nature of LibArchive
        Object.defineProperty(entry, 'data', {
          get: () => {
            if (WARNING)
              console.warn("Accessing entry's data after the extract loop is not performatic")
            $archive = openArchive(buffer, passphrase)
            try {
              while (--skips >= 0) {
                try {
                  getNextEntry($archive)
                } catch (error) {
                  throw error instanceof NullError
                    ? new FileReadError(ENULL, `Couldn't find entry ${offset} inside archive`)
                    : error
                }
              }

              return entryDataGetter()
            } finally {
              closeArchive($archive)
            }
          },
        })
      }
    }
  } finally {
    closeArchive(archive)
  }
}

/**
 * Uncompress all entries in an archive
 *
 * > This function is the preferred choice over `extract` when your use case
 *   involves accessing the content data of all entries within the archive,
 *   and memory usage is not a critical concern. It provides a performance
 *   advantage for this specific scenario by circumventing certain workarounds
 *   required to support random-time access to an entry's data within
 *   LibArchive's streaming process model. If your goal is to process all
 *   entries and retrieve their content, `extractAll` is the recommended method.
 * @param {ArrayBufferLike} data Archive's data
 * @param {string | ExtractOpts} [opts] Extract options, string value will be interpreted as password
 * @returns {Entry[]} List with all entries included in the archive
 */
export function extractAll(data, opts) {
  return Array.from(extract(data, opts), e => {
    // Touch entry's data to force it to load it into memory
    void e.data
    return e
  })
}

export {
  ArchiveError,
  NullError,
  RetryError,
  FatalError,
  FailedError,
  FileReadError,
  PassphraseError,
} from './wasm/errors.mjs'
