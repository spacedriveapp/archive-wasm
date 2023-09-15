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
  Pointer,
  openArchive,
  getFileData,
  closeArchive,
  getNextEntry,
  getEntryPathName,
  getEntrySize,
  getEntryType,
  hasEncryptedEntries,
  NULL,
} from './wasm/bridge.mjs'

/**
 * Registry to automatically free any unreferenced {@link Archive}
 * @type {FinalizationRegistry<number>}
 */
const ArchiveRegistry = new FinalizationRegistry(pointer => {
  closeArchive(pointer)
})

/**
 * @callback GetEntryData
 * @returns {ArrayBufferLike}
 */

/**
 * @typedef {Object} Entry
 * @property {number} size
 * @property {string} path
 * @property {import('./wasm/bridge.mjs').EntryType} type
 * @property {GetEntryData} data
 */

export class Archive {
  /** @type {Pointer} */
  #buffer

  /** @type {number} */
  #archive

  /**
   * Uncompress archives
   *
   * Supports the following formats:
   * LZ4, LZO, LZMA, ZSTD, ZLIB, BZip2
   *
   * @param {ArrayBufferLike} data - Archive data
   * @param {string} [passphrase] - Archive passphrase
   */
  constructor(data, passphrase) {
    this.#buffer = new Pointer().fill(data, true)
    this.#archive = openArchive(this.#buffer, passphrase)
    ArchiveRegistry.register(this, this.#archive)
  }

  /**
   * Detect if archive has encrypted data
   * @returns {import('./wasm/bridge.mjs').Encryption} Wheter the given archive is encripted or not
   */
  get hasEncryptedEntries() {
    return hasEncryptedEntries(this.#archive)
  }

  /**
   * Iterate through all the archive's entries
   *
   * @yields {Entry}
   */
  *entries() {
    while (true) {
      const entryPointer = getNextEntry(this.#archive)
      if (entryPointer === NULL) break

      const path = getEntryPathName(entryPointer)
      const sizen = getEntrySize(entryPointer)
      const size = Number(sizen)
      if (size > Number.MAX_SAFE_INTEGER) {
        throw new Error(`Entry ${path} size exceeds MAX_SAFE_INTEGER: ${sizen}`)
      }

      /** @type {ArrayBufferLike} */
      let data
      const self = this

      yield {
        size,
        path,
        type: getEntryType(entryPointer),
        get data() {
          if (data == null) data = getFileData(self.#archive, size).read()
          return data
        },
      }
    }
  }
}

export { EntryType } from './wasm/bridge.mjs'
