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
 * @file Bridge between idiomatic Javascript API and the raw LibArchive WASM API
 * @module archive-wasm/wasm/bridge
 * @typicalname bridge
 */

import { ReturnCode } from './enums.mjs'
import {
  EPASS,
  ENULL,
  ARCHIVE_ERRNO_MISC,
  RetryError,
  FatalError,
  PassphraseError,
  FailedError,
  ArchiveError,
  FileReadError,
  NullError,
} from './errors.mjs'
import lib from './module.mjs'
import { Pointer } from './pointer.mjs'

/**
 * Get the message content of the last error that occured
 * const char	*archive_error_string(struct archive *archive);
 * @private
 * @callback GetErrorCb
 * @param {number} archive Pointer to archive struct
 * @returns {string} Last error message that occurred, empty string if no error has occurred yet
 */
const getError = /** @type {GetErrorCb} */ (
  lib.cwrap('archive_error_string', 'string', ['number'])
)

/**
 * Get numeric error of the last error that occured
 * int archive_errno(struct archive *archive);
 * @private
 * @callback getErrorCodeCb
 * @param {number} archive Pointer to archive struct
 * @returns {number} Last error code that occurred, zero if no error has occurred yet
 */
const getErrorCode = /** @type {getErrorCodeCb} */ (
  lib.cwrap('archive_errno', 'number', ['number'])
)

/**
 * Open a compressed archive in memory
 * void archive_clear_error(struct archive *archive);
 * @private
 * @callback clearErrorCb
 * @param {number} archive Pointer to archive struct
 */
const clearError = /** @type {clearErrorCb} */ (lib.cwrap('archive_clear_error', null, ['number']))

/**
 * Wrap calls that interact with archive to do erro checking/clean-up
 * @param {Function} cb Native call
 * @param {null | boolean} checkReturn Wheter the return of the call is a {@link ReturnCode} to be checked and consumed,
 *                                     null is a special case for functions that return a pointer and need to validate that it isn't Pointer.NULL
 * @returns {Function} cb wrapped with error checking logic
 */
function errorCheck(cb, checkReturn) {
  /**
   * @param {import('./pointer.mjs').Pointer} archive = Pointer to archive struct
   * @param {unknown[]} args Other arguments
   * @returns {unknown} cb return value
   */
  function errorCheckWrapper(archive, ...args) {
    if (archive.isNull()) throw new NullError('Archive pointer is Pointer.NULL')

    const returnCode = cb(archive.raw, ...args)
    if (archive.isNull()) return returnCode

    const errorMsg = getError(archive.raw) ?? 'Unknown error'
    const errorCode = getErrorCode(archive.raw)
    try {
      if (checkReturn) {
        switch (returnCode) {
          case ReturnCode.WARN:
            console.warn(`${cb.name}: ${errorMsg}`)
          // eslint-disable-next-line no-fallthrough
          case ReturnCode.OK:
          case ReturnCode.EOF:
            return
          case ReturnCode.RETRY:
            throw new RetryError(errorCode, errorMsg)
          case ReturnCode.FATAL:
            throw new FatalError(errorCode, errorMsg)
          case ReturnCode.FAILED:
            throw new FailedError(errorCode, errorMsg)
          default:
            throw new Error('Invalid return code')
        }
      } else {
        if (errorCode !== 0) throw new ArchiveError(errorCode, errorMsg)
        if (checkReturn === null) {
          if (returnCode === Pointer.NULL || returnCode === '') {
            throw new NullError('Returned unexpected Pointer.NULL')
          } else if (typeof returnCode === 'number') {
            return new Pointer(0, returnCode)
          }
        }
        return returnCode
      }
    } finally {
      clearError(archive.raw)
    }
  }

  return errorCheckWrapper
}

/**
 * struct archive *open_archive(const void *buf, size_t size, const char *passphrase);
 * @private
 * @callback OpenArchiveCb
 * @param {number} buf Pointer to archive data buffer
 * @param {number} size Size of archive data buffer
 * @param {string} passphrase Password to decrypt archive data
 * @returns {number} Pointer to struct representing the opened archive
 */
const _openArchive = /** @type {OpenArchiveCb} */ (
  lib.cwrap('open_archive', 'number', ['number', 'number', 'string'])
)

/**
 * Open a compressed archive in memory
 * @private
 * @param {import('./pointer.mjs').Pointer} buffer Archive data
 * @param {string} [passphrase] to decrypt archive data
 * @returns {import('./pointer.mjs').Pointer} Pointer to struct representing the opened archive
 */
export function openArchive(buffer, passphrase) {
  if (buffer.size == null || buffer.isNull())
    throw new NullError("Archive data must be a malloc'd buffer, not NULL or externally managed")

  if (passphrase == null) passphrase = ''

  const archive = new Pointer(0, _openArchive(buffer.raw, buffer.size, passphrase))
  if (archive.isNull()) throw new NullError('Failed to allocate memory')

  const errorCode = getErrorCode(archive.raw)
  if (errorCode !== 0) {
    const errorMsg = getError(archive.raw)

    clearError(archive.raw)
    closeArchive(archive)

    throw new (errorCode === EPASS ? PassphraseError : ArchiveError)(errorCode, errorMsg)
  }

  return archive
}

/**
 * Get the current entry of an archive
 * struct archive_entry *get_next_entry(struct archive *archive);
 * @private
 * @callback GetNextEntryCb
 * @param {import('./pointer.mjs').Pointer} archive Pointer to archive struct
 * @returns {import('./pointer.mjs').Pointer} Pointer to struct representing an archive entry
 */

/** @private  */
export const getNextEntry = /** @type {GetNextEntryCb} */ (
  errorCheck(lib.cwrap('get_next_entry', 'number', ['number']), null)
)

/**
 * void * get_filedata(void * archive, size_t buffsize);
 * @private
 * @callback GetFileDataCb
 * @param {number} archive Pointer to archive struct
 * @param {number} buffsize File size to be read, must be a value returned by {@link GetEntrySizeCb}
 * @returns {number} Pointer to file data buffer
 */
const _getFileData = /** @type {GetFileDataCb} */ (
  lib.cwrap('get_filedata', 'number', ['number', 'number'])
)

/**
 * Get the file data for the current entry of an archive
 * @private
 * @param {import('./pointer.mjs').Pointer} archive Pointer to archive struct
 * @param {bigint} buffsize File size to be read, must be a value returned by {@link GetEntrySizeCb}
 * @returns {ArrayBufferLike} Pointer to file data in WASM HEAP
 */
export function getFileData(archive, buffsize) {
  if (archive.isNull()) throw new NullError('Archive pointer is Pointer.NULL')

  if (buffsize === 0n) return new ArrayBuffer(0)

  const size = Number(buffsize)
  if (size > Number.MAX_SAFE_INTEGER) {
    throw new FileReadError(
      ARCHIVE_ERRNO_MISC,
      `Couldn't read entry data due to it's size exceeding MAX_SAFE_INTEGER: ${buffsize}`
    )
  }

  const fileDataPointer = new Pointer(size, _getFileData(archive.raw, size))
  try {
    let readLen, errorMsg, errorCode
    if (archive.isNull()) {
      errorMsg = 'Archive pointer is Pointer.NULL'
      errorCode = ENULL
    } else {
      errorMsg = getError(archive.raw)
      errorCode = getErrorCode(archive.raw)
    }

    try {
      if (errorCode !== 0) {
        throw errorCode === ARCHIVE_ERRNO_MISC &&
          errorMsg.toLocaleLowerCase().includes('passphrase')
          ? new PassphraseError(EPASS, errorMsg)
          : new FileReadError(errorCode, errorMsg || 'Failed to read archive data')
      }

      if (fileDataPointer.isNull())
        throw new NullError('Failed to allocate memory for archive data')

      readLen = Number.parseInt(errorMsg)
      if (Number.isNaN(readLen) || readLen < 0) {
        fileDataPointer.free()
        throw new FileReadError(ARCHIVE_ERRNO_MISC, 'Invalid size for archive data')
      }
    } finally {
      if (!archive.isNull()) clearError(archive.raw)
    }

    return fileDataPointer.realloc(readLen, true).read()
  } finally {
    fileDataPointer.free()
  }
}

/**
 * int archive_read_free(struct archive * archive);
 * @private
 * @callback CloseArchiveCb
 * @param {import('./pointer.mjs').Pointer} archive Pointer to archive struct
 */
const _closeArchive = /** @type {CloseArchiveCb} */ (
  errorCheck(lib.cwrap('archive_read_free', 'number', ['number']), true)
)

/**
 * Free archive pointer from memory
 * @private
 * @param {import('./pointer.mjs').Pointer} archive Pointer to archive struct
 */
export function closeArchive(archive) {
  try {
    _closeArchive(archive)
  } finally {
    archive.free()
  }
}

/**
 * Get the size of the current entry of an archive
 * la_int64_t archive_entry_size(struct archive_entry *archive);
 * @private
 * @callback GetEntrySizeCb
 * @param {import('./pointer.mjs').Pointer} entry Pointer to entry struct
 * @returns {bigint} Current entry size to be used in {@link GetFileDataCb}
 */

/** @private */
export const getEntrySize = /** @type {GetEntrySizeCb} */ (
  errorCheck(lib.cwrap('archive_entry_size', 'number', ['number']), false)
)

/**
 * Get the st_mode of the current entry of an archive
 * mode_t archive_entry_filetype(struct archive_entry *archive);
 * @private
 * @callback GetEntryModeCb
 * @param {import('./pointer.mjs').Pointer} entry Pointer to entry struct
 * @returns {number} Current entry's st_mode
 */

/** @private */
export const getEntryMode = /** @type {GetEntryModeCb} */ (
  errorCheck(lib.cwrap('archive_entry_mode', 'number', ['number']), false)
)

/**
 * time_t	 archive_entry_atime(struct archive_entry *archive);
 * @private
 * @callback GetEntryAtimeCb
 * @param {import('./pointer.mjs').Pointer} entry Pointer to entry struct
 * @returns {bigint} Current entry atime
 */

/** @private */
export const getEntryAtime = /** @type {GetEntryAtimeCb} */ (
  errorCheck(lib.cwrap('archive_entry_atime', 'number', ['number']), false)
)

/**
 * time_t archive_entry_ctime(struct archive_entry *archive)
 * @private
 * @callback GetEntryCtimeCb
 * @param {import('./pointer.mjs').Pointer} entry Pointer to entry struct
 * @returns {bigint} Current entry ctime
 */

/** @private */
export const getEntryCtime = /** @type {GetEntryCtimeCb} */ (
  errorCheck(lib.cwrap('archive_entry_ctime', 'number', ['number']), false)
)

/**
 * time_t archive_entry_mtime(struct archive_entry *archive)
 * @private
 * @callback GetEntryMtimeCb
 * @param {import('./pointer.mjs').Pointer} entry Pointer to entry struct
 * @returns {bigint} Current entry mtime
 */

/** @private */
export const getEntryMtime = /** @type {GetEntryMtimeCb} */ (
  errorCheck(lib.cwrap('archive_entry_mtime', 'number', ['number']), false)
)

/**
 * const char *archive_entry_symlink_utf8(struct archive_entry *entry)
 * @private
 * @callback GetEntrySymlinkCb
 * @param {import('./pointer.mjs').Pointer} entry Pointer to entry struct
 * @returns {string} Current entry symlink path, empty string if entry is not a symlink
 */

/** @private */
export const getEntrySymlink = /** @type {GetEntrySymlinkCb} */ (
  errorCheck(lib.cwrap('archive_entry_symlink_utf8', 'string', ['number']), false)
)

/**
 * const char *archive_entry_hardlink_utf8(struct archive_entry *entry)
 * @private
 * @callback GetEntryHardlinkCb
 * @param {import('./pointer.mjs').Pointer} entry Pointer to entry struct
 * @returns {string} Current entry hardlink path, empty string if entry is not a hardlink
 */

/** @private */
export const getEntryHardlink = /** @type {GetEntryHardlinkCb} */ (
  errorCheck(lib.cwrap('archive_entry_hardlink_utf8', 'string', ['number']), false)
)

/**
 * Get the name of the current entry of an archive
 * const char * archive_entry_pathname_utf8(struct archive_entry *entry)
 * @private
 * @callback GetEntryNameCb
 * @param {import('./pointer.mjs').Pointer} entry Pointer to entry struct
 * @returns {string} Current entry name
 */

/** @private */
export const getEntryPathName = /** @type {GetEntryNameCb} */ (
  errorCheck(lib.cwrap('archive_entry_pathname_utf8', 'string', ['number']), null)
)

/**
 * time_t archive_entry_birthtime(struct archive_entry *archive)
 * @private
 * @callback GetEntryBirthtimeCb
 * @param {import('./pointer.mjs').Pointer} entry Pointer to entry struct
 * @returns {bigint} Current entry birthtime
 */

/** @private */
export const getEntryBirthtime = /** @type {GetEntryBirthtimeCb} */ (
  errorCheck(lib.cwrap('archive_entry_birthtime', 'number', ['number']), false)
)
