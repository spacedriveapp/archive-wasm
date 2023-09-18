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

import {
  openArchive,
  closeArchive,
  getNextEntry,
  getFileData,
  getEntryAtime,
  getEntryBirthtime,
  getEntryCtime,
  getEntryMode,
  getEntryMtime,
  getEntryPathName,
  getEntrySize,
} from './wasm/bridge.mjs'
import { FILETYPE_FLAG, EntryType } from './wasm/enums.mjs'
import { ENULL, FileReadError, NullError } from './wasm/errors.mjs'
import { Pointer } from './wasm/pointer.mjs'

/**
 * A compressed data entry inside an archive
 * @typedef {Object} Entry
 * @property {bigint} size Size of the entry in bytes.
 * @property {number} mode A bit-field describing the file type and mode.
 * @property {string} path Path of the entry within the archive.
 * @property {ArrayBuffer} data Extracted data content of entry.
 * @property {bigint} atime The timestamp indicating the last time this file was accessed expressed in nanoseconds since the POSIX Epoch.
 * @property {bigint} ctime The timestamp indicating the last time the file status was changed expressed in nanoseconds since the POSIX Epoch.
 * @property {bigint} mtime The timestamp indicating the last time this file was modified expressed in nanoseconds since the POSIX Epoch.
 * @property {bigint} birthtime The timestamp indicating the creation time of this file expressed in nanoseconds since the POSIX Epoch.
 */

/** @type {boolean} */
let WARNING = true

/** Disable lib warnings */
export function disableWarning() {
  WARNING = false
}

/**
 * Uncompress archive, iterate through all it's entries
 *
 * @param {ArrayBufferLike} data The archive data
 * @param {string} [passphrase] Passphrase to decrypt protect zip archives
 * @yields {Entry}
 */
export function* extract(data, passphrase) {
  let offset = 0
  const buffer = new Pointer().fill(data, true)
  const archive = openArchive(buffer, passphrase)

  try {
    while (true) {
      let pointer

      try {
        pointer = getNextEntry(archive)
      } catch (error) {
        // Null here means archive EOF
        if (error instanceof NullError) return

        throw error
      }

      // Cache the current archive so it can be modified by the getter
      let $archive = archive

      /** @type {Entry} */
      const entry = {
        size: getEntrySize(pointer),
        mode: getEntryMode(pointer),
        path: getEntryPathName(pointer),
        atime: getEntryAtime(pointer),
        ctime: getEntryCtime(pointer),
        mtime: getEntryMtime(pointer),
        birthtime: getEntryBirthtime(pointer),

        get data() {
          const data = getFileData($archive, entry.size)

          // Replace the getter with the actual value now that we got it
          Object.defineProperty(entry, 'data', {
            value: data,
          })
          return data
        },
      }

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

      offset++
    }
  } finally {
    closeArchive(archive)
  }
}

/**
 * Uncompress all entries in an archive
 *
 * @param {ArrayBufferLike} data The archive data
 * @param {string} [passphrase] Passphrase to decrypt protect zip archives
 * @return {Entry[]} List with all entries included in the archive
 */
export function extractAll(data, passphrase) {
  return Array.from(extract(data, passphrase), e => {
    void e.data
    return e
  })
}

/**
 * Parse an entry's mode to retrieve it's type
 *
 * @param {Entry} entry
 * @returns {'FILE' | 'NAMED_PIPE' | 'SOCKET' | 'DIR' | 'BLOCK_DEVICE' | 'SYMBOLIC_LINK' | 'CHARACTER_DEVICE'} type
 */
export function getEntryType(entry) {
  switch (FILETYPE_FLAG & entry.mode) {
    case EntryType.FILE:
      return 'FILE'

    case EntryType.NAMED_PIPE:
      return 'NAMED_PIPE'

    case EntryType.SOCKET:
      return 'SOCKET'

    case EntryType.DIR:
      return 'DIR'

    case EntryType.BLOCK_DEVICE:
      return 'BLOCK_DEVICE'

    case EntryType.SYMBOLIC_LINK:
      return 'SYMBOLIC_LINK'

    case EntryType.CHARACTER_DEVICE:
      return 'CHARACTER_DEVICE'

    default:
      throw Error('Unknow entry type')
  }
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
