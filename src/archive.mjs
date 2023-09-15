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
  NULL,
} from './wasm/bridge.mjs'

/**
 * Registry to automatically close archive when all of its entries get garbage collected
 * @type {FinalizationRegistry<number>}
 */
const ArchiveRegistry = new FinalizationRegistry(archive => {
  closeArchive(archive)
})

/**
 * Uncompress archive, iterate through all it's entries
 *
 * Supports the following formats:
 * LZ4, LZO, LZMA, ZSTD, ZLIB, BZip2
 *
 * @param {ArrayBufferLike} data - Archive data
 * @param {string} [passphrase] - Archive passphrase
 * @yields {Entry}
 */
export function* extract(data, passphrase) {
  const marker = Object.create(null)
  const buffer = new Pointer().fill(data, true)
  const archive = openArchive(buffer, passphrase)

  /**
   * Associate the marker object with the archive pointer,
   * which will in turn be present in all the entries object,
   * so that when all of them get garbage collected,
   * the marker will too and then trigger the closing of the archive pointer
   */
  ArchiveRegistry.register(marker, archive)

  let entryPointer
  while ((entryPointer = getNextEntry(archive)) !== NULL) {
    const path = getEntryPathName(entryPointer)
    const sizen = getEntrySize(entryPointer)

    const size = Number(sizen)
    if (size > Number.MAX_SAFE_INTEGER) {
      throw new Error(`Entry ${path} size exceeds MAX_SAFE_INTEGER: ${sizen}`)
    }

    /** @type {ArrayBufferLike} */
    let data
    const entry = {
      size,
      path,
      type: getEntryType(entryPointer),
      get data() {
        if (data == null) data = getFileData(archive, size).read()
        return data
      },
      [Symbol('marker')]: marker,
    }

    yield entry
  }
}

export { EntryType } from './wasm/bridge.mjs'
