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

// @ts-expect-error
// eslint-disable-next-line import/no-unresolved
import archiveWasm from './libarchive.mjs'

export const NULL = 0

/**
 * @callback CWrap
 * @param {string} functionName
 * @param {string?} returnType
 * @param {Array.<string>=} argTypes
 * @returns {Function} Wrapper
 */

/**
 * @typedef {Object} ArchiveWASM
 * @property {CWrap} cwrap Wrap WASM function in a JS function
 * @property {Int8Array} HEAP8 8bit signed integer view of WASM memory
 */
const archive = /** @type {ArchiveWASM} */ (
  await archiveWasm({
    print: console.log,
    printErr: console.error,
    noInitialRun: true,
    noExitRuntime: true,
  })
)

/**
 * Error codes: Use archive_errno() and archive_error_string()
 * to retrieve details.  Unless specified otherwise, all functions
 * that return 'int' use these codes.
 *
 * ARCHIVE_EOF    1	    // Found end of archive.
 * ARCHIVE_OK	    0	    // Operation was successful.
 * ARCHIVE_RETRY	(-10)	// Retry might succeed.
 * ARCHIVE_WARN	  (-20)	// Partial success.
 * // For example, if write_header "fails", then you can't push data.
 * ARCHIVE_FAILED	(-25)	// Current operation cannot complete.
 * // But if write_header is "fatal," then this archive is dead and useless.
 * ARCHIVE_FATAL	(-30)	// No more operations are possible.
 *
 * @see {@link https://github.com/libarchive/libarchive/blob/v3.7.2/libarchive/archive.h#L188C1-L200}
 *
 * @readonly
 * @enum {number}
 */
const ReturnCode = {
  OK: 0,
  EOF: 1,
  RETRY: -10,
  WARN: -20,
  FAILED: -25,
  FATAL: -30,
}

export class RetryError extends Error {
  /**
   * Error used when a notive call returns {@link ReturnCode.RETRY}
   *
   * @param {string} message Error message
   */
  constructor(message) {
    super(message)
    this.name = RetryError.name
  }
}

export class FatalError extends Error {
  /**
   * Error used when a notive call returns {@link ReturnCode.FATAL}
   *
   * @param {string} message Error message
   */
  constructor(message) {
    super(message)
    this.name = FatalError.name
  }
}

export class FailedError extends Error {
  /**
   * Error used when a notive call returns {@link ReturnCode.FAILED}
   *
   * @param {string} message Error message
   */
  constructor(message) {
    super(message)
    this.name = FailedError.name
  }
}

/**
 * void * malloc(size_t size);
 *
 * @callback MallocCB
 * @param {number} size Memory size to be allocated
 * @returns {number} Pointer to allocated memory
 */
const malloc = /** @type {MallocCB} */ (archive.cwrap('malloc', 'number', ['number']))

/**
 * void free(void *ptr);
 *
 * @callback FreeCB
 * @param {number} pointer Pointer to memory to be freed
 */
const free = /** @type {FreeCB} */ (archive.cwrap('free', null, ['number']))

/**
 * Registry to automatically free any unreferenced {@link Pointer}
 * @type {FinalizationRegistry<number>}
 */
const MemoryRegistry = new FinalizationRegistry(pointer => {
  free(pointer)
})

export class Pointer {
  /** @type {number} */
  #size

  /** @type {number} */
  #pointer

  /**
   * High level representation of a WASM memory pointer
   *
   * @param {number} [size]
   * @param {number} [pointer]
   */
  constructor(size, pointer) {
    if (typeof size === 'number' && size < 0) throw new Error('Size must be >= 0')

    this.#size = size ?? 0

    if (pointer === undefined && this.#size > 0) {
      this.#pointer = malloc(this.#size)
      if (this.#pointer === NULL) throw new Error('Failed to allocate memory')
    } else {
      this.#pointer = pointer ?? NULL
      if (this.#pointer !== NULL && this.#size === 0)
        throw new Error('Size for an already allocated pointer must be >= 0')
    }

    if (this.#pointer !== NULL) MemoryRegistry.register(this, this.#pointer, this)
  }

  get size() {
    return this.#size
  }

  get pointer() {
    return this.#pointer
  }

  /**
   * Fill memory with data
   *
   * .. note::
   *    When grow is false, this method throws when trying to fill a NULL pointer,
   *    otherwise it only fills memory up to {@link Pointer.size}
   *
   * @param {bigint | number | string | ArrayLike.<number> | ArrayBufferLike} data Data to copy to memory
   * @param {boolean} [grow=false] - Wheter to alloc more data to make sure data fits inside {@link Pointer}
   * @returns {Pointer}
   */
  fill(data, grow = false) {
    /** @type {Uint8Array} */
    let array
    switch (typeof data) {
      case 'string':
        array = new TextEncoder().encode(data)
        break
      case 'number':
        array = new Uint8Array([data])
        break
      case 'bigint':
        array = new Uint8Array(new BigInt64Array([data]))
        break
      default:
        if (!(data instanceof Uint8Array)) {
          array = new Uint8Array(data)
        } else {
          array = data
        }
    }

    if (grow) {
      this.realloc(array.byteLength, true)
    } else if (array.byteLength > this.#size) {
      array = array.subarray(0, this.#size)
    }

    if (this.#pointer === NULL) throw new Error('Filling invalid pointer')

    archive.HEAP8.set(array, this.#pointer)

    return this
  }

  /**
   * Copy data from WASM memory and return it
   *
   * @param {number} [size] - How much to read from memory
   * @returns {ArrayBufferLike} Memory view
   */
  read(size) {
    if (size == null) {
      size = this.#size
    } else if (size > this.#size) {
      throw new Error('Attempting to read past the pointer allocated memory')
    } else if (size < 0) {
      throw new Error('Size must be a positive number')
    }

    if (this.#pointer === NULL) throw new Error('Reading invalid pointer')

    return archive.HEAP8.slice(this.#pointer, this.#pointer + size).buffer
  }

  /**
   * Free internal pointer
   */
  free() {
    free(this.#pointer)
    MemoryRegistry.unregister(this)
    this.#pointer = NULL
  }

  /**
   * Change pointer size
   *
   * @param {number} size New pointer size, 0 frees the pointer
   * @returns {Pointer}
   */
  realloc(size, avoidShrinking = false) {
    if (size < 0) throw new Error('Size must be >= 0')
    if (size === this.#size || (avoidShrinking && size < this.#size)) return this

    /** @type {number} */
    let pointer
    if (size > 0) {
      pointer = malloc(size)
      if (pointer === NULL) throw new Error('Failed to allocate memory')

      if (this.#pointer !== NULL) {
        archive.HEAP8.copyWithin(
          pointer,
          this.#pointer,
          this.#pointer + Math.min(size, this.#size)
        )
        this.free()
      }

      this.#pointer = pointer
      MemoryRegistry.register(this, this.#pointer, this)
    } else {
      this.free()
    }

    this.#size = size

    return this
  }
}

/**
 * Open a compressed archive in memory
 * void archive_clear_error(struct archive *archive);
 *
 * @callback clearErrorCb
 * @param {number} archive Pointer to archive struct
 */
const clearError = /** @type {clearErrorCb} */ (
  archive.cwrap('archive_clear_error', null, ['number'])
)

/**
 * Get the message content of the last error that occured
 * const char	*archive_error_string(struct archive *archive);
 *
 * @callback GetErrorCb
 * @param {number} archive Pointer to archive struct
 * @returns {string} Last error that occurred, empty string if no error has occurred yet
 */
const getError = /** @type {GetErrorCb} */ (
  archive.cwrap('archive_error_string', 'string', ['number'])
)

/**
 * Wrap calls that interact with archive to do erro checking/clean-up
 * @param {Function} cb Native call
 * @param {null | boolean} checkReturn Wheter the return of the call is a {@link ReturnCode} to be checked and consumed,
 *                                       null is a special case for functions taht return a pointer and need to validate that it isn't NULL
 * @returns {Function}
 */
function errorCheck(cb, checkReturn) {
  /**
   * @param {number} archive = Pointer to archive struct
   * @param {Array.<any>} args Other arguments
   * @returns {unknown}
   */
  function errorCheckWrapper(archive, ...args) {
    const returnCode = cb(archive, ...args)
    try {
      if (checkReturn) {
        switch (returnCode) {
          case ReturnCode.OK:
            return true
          case ReturnCode.EOF:
            return false
          case ReturnCode.WARN:
            console.warn(`LibArchive.${cb.name}: ${getError(archive) || 'Unknown'}`)
            return false
          case ReturnCode.RETRY:
            throw new RetryError(`${cb.name}:` + (getError(archive) || 'Unknown'))
          case ReturnCode.FATAL:
            throw new FatalError(`${cb.name}:` + (getError(archive) || 'Unknown'))
          case ReturnCode.FAILED:
            throw new FailedError(`${cb.name}:` + (getError(archive) || 'Unknown'))
          default:
            throw new Error(`LibArchive.${cb.name}: Invalid return code`)
        }
      } else {
        const errorMsg = getError(archive)
        if (errorMsg !== '') throw new Error(errorMsg)
        if (checkReturn === null && (returnCode === NULL || returnCode === ''))
          throw new Error(`LibArchive.${cb.name}: returned NULL`)
        return returnCode
      }
    } finally {
      clearError(archive)
    }
  }

  return errorCheckWrapper
}

/**
 * Open a compressed archive in memory
 * struct archive *archive_open(const void *buf, size_t size, const char *passphrase);
 *
 * @callback OpenArchiveCb
 * @param {number} buf Pointer to archive data buffer
 * @param {number} size Size of archive data buffer
 * @param {string} passphrase Password to decrypt archive data
 * @returns {number} Pointer to struct representing the opened archive
 */
const _openArchive = /** @type {OpenArchiveCb} */ (
  archive.cwrap('archive_open', 'number', ['number', 'number', 'string'])
)

/**
 * Open a compressed archive in memory
 *
 * @param {Pointer} buffer Buffer
 * @param {string} [passphrase] - Password to decrypt archive data
 * @returns {number} Pointer to struct representing the opened archive
 */
export function openArchive(buffer, passphrase) {
  if (buffer.pointer === NULL) throw new Error('Invalid buffer')

  if (passphrase == null) passphrase = ''

  const archive = _openArchive(buffer.pointer, buffer.size, passphrase)
  if (archive === NULL) throw new Error('Failed to allocate archive')

  const errorMsg = getError(archive)
  if (errorMsg !== '') {
    clearError(archive)
    closeArchive(archive)
    throw new Error(errorMsg)
  }

  return archive
}

/**
 * Get the current entry of an archive
 * struct archive_entry *get_next_entry(struct archive *archive);
 *
 * @callback GetNextEntryCb
 * @param {number} archive Pointer to archive struct
 * @returns {number} Pointer to struct representing an archive entry
 */
export const getNextEntry = /** @type {GetNextEntryCb} */ (
  errorCheck(archive.cwrap('get_next_entry', 'number', ['number']), false)
)

/**
 * Get the file data for the current entry of an archive
 * void * get_filedata(void * archive, size_t buffsize);
 *
 * @callback GetFileDataCb
 * @param {number} archive Pointer to archive struct
 * @param {number} buffsize File size to be read, must be a value returned by {@link GetEntrySizeCb}
 * @returns {number} Pointer to file data buffer
 */
const _getFileData = /** @type {GetFileDataCb} */ (
  archive.cwrap('get_filedata', 'number', ['number', 'number'])
)

/**
 * Get the file data for the current entry of an archive
 *
 * @param {number} archive Pointer to archive struct
 * @param {number} buffsize File size to be read, must be a value returned by {@link GetEntrySizeCb}
 * @returns {Pointer} Pointer to file data in WASM HEAP
 */
export function getFileData(archive, buffsize) {
  const fileDataPointer = _getFileData(archive, buffsize)

  let readLen = NaN
  let errorMsg = getError(archive)

  try {
    if (fileDataPointer === NULL) {
      if (errorMsg === '') errorMsg = 'Failed to allocate archive'
      throw new Error(errorMsg)
    }

    readLen = Number.parseInt(errorMsg)
    if (Number.isNaN(readLen) || readLen < 0) {
      free(fileDataPointer)
      throw new Error('Invalid file read')
    }
  } finally {
    clearError(archive)
  }

  const pointer = new Pointer(buffsize, fileDataPointer)
  pointer.realloc(readLen)

  return pointer
}

/**
 * Free an open archive from memory
 * int archive_read_free(struct archive * archive);
 *
 * .. note::
 *    The native call returns {@link ReturnCode.OK} on success, or {@link ReturnCode.FATAL}, which is
 *    checked on every call and converted into a JS Error in case the return is not {@link ReturnCode.OK}
 *
 * @callback CloseArchiveCb
 * @param {number} archive Pointer to archive struct
 * @returns {boolean} Whether the call sucessed but had a warning
 */
export const closeArchive = /** @type {CloseArchiveCb} */ (
  errorCheck(archive.cwrap('archive_read_free', 'number', ['number']), true)
)

/**
 * Get the size of the current entry of an archive
 * la_int64_t archive_entry_size(struct archive_entry *archive);
 *
 * @callback GetEntrySizeCb
 * @param {number} archive Pointer to archive struct
 * @returns {bigint} Current entry size to be used in {@link GetFileDataCb}
 */
export const getEntrySize = /** @type {GetEntrySizeCb} */ (
  archive.cwrap('archive_entry_size', 'number', ['number'])
)

/**
 * Get the name of the current entry of an archive
 * const char * archive_entry_pathname_utf8(struct archive_entry *entry)
 *
 * @callback GetEntryNameCb
 * @param {number} archive Pointer to archive struct
 * @returns {string} Current entry name
 */
export const getEntryPathName = /** @type {GetEntryNameCb} */ (
  errorCheck(archive.cwrap('archive_entry_pathname_utf8', 'string', ['number']), null)
)

/**
 * File-type constants
 * These are returned from archive_entry_filetype() and passed to archive_entry_set_filetype()
 *
 * AE_IFREG	 0100000
 * AE_IFLNK	 0120000
 * AE_IFSOCK 0140000
 * AE_IFCHR	 0020000
 * AE_IFBLK	 0060000
 * AE_IFDIR	 0040000
 * AE_IFIFO	 0010000
 *
 * @see {@link https://github.com/libarchive/libarchive/blob/v3.7.2/libarchive/archive_entry.h#L186-L193}
 *
 * @readonly
 * @enum {number}
 */
export const EntryType = {
  FILE: 0o0100000,
  SYMBOLIC_LINK: 0o0120000,
  SOCKET: 0o0140000,
  CHARACTER_DEVICE: 0o0020000,
  BLOCK_DEVICE: 0o0060000,
  DIR: 0o0040000,
  NAMED_PIPE: 0o0010000,
}

/**
 * Get the type of the current entry of an archive
 * mode_t archive_entry_filetype(struct archive_entry *archive);
 *
 * @callback GetEntryTypeCb
 * @param {number} archive Pointer to archive struct
 * @returns {EntryType} Current entry type
 */
export const getEntryType = /** @type {GetEntryTypeCb} */ (
  archive.cwrap('archive_entry_filetype', 'number', ['number'])
)

/**
 * Codes returned by archive_read_has_encrypted_entries().
 *
 * ARCHIVE_READ_FORMAT_ENCRYPTION_UNSUPPORTED -2
 * ARCHIVE_READ_FORMAT_ENCRYPTION_DONT_KNOW -1
 *
 * @see {@link https://github.com/libarchive/libarchive/blob/v3.7.2/libarchive/archive.h#L362-L372}
 *
 * @readonly
 * @enum {number}
 */
export const Encryption = {
  UNSUPPORTED: -2,
  UNKNOW: -1,
  ENCRYPTED: 1,
  PLAIN: 0,
}

/**
 * Check wheter the current entry is encrypted
 * int archive_read_has_encrypted_entries(struct archive *archive);
 *
 * .. note::
 *    In general, this function will return values below zero when the reader
 *    is uncertain or totally incapable of encryption support.
 *    When this function returns 0 you can be sure that the reader supports
 *    encryption detection but no encrypted entries have been found yet.
 *
 * @callback HasEncryptedEntriesCb
 * @param {number} archive Pointer to archive struct
 * @returns {Encryption} Wheter the given archive is encripted or not
 */
export const hasEncryptedEntries = /** @type {HasEncryptedEntriesCb} */ (
  archive.cwrap('archive_read_has_encrypted_entries', 'number', ['number'])
)
