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

import { NullError } from './errors.mjs'
import lib from './module.mjs'

/**
 * void * malloc(size_t size);
 *
 * @callback MallocCB
 * @param {number} size Memory size to be allocated
 * @returns {number} Pointer to allocated memory
 */
const malloc = /** @type {MallocCB} */ (lib.cwrap('malloc', 'number', ['number']))

/**
 * void free(void *ptr);
 *
 * @callback FreeCB
 * @param {number} pointer Pointer to memory to be freed
 */
const free = /** @type {FreeCB} */ (lib.cwrap('free', null, ['number']))

/**
 * Registry to automatically free any unreferenced {@link Pointer}
 * @type {FinalizationRegistry<number>}
 */
const MemoryRegistry = new FinalizationRegistry(pointer => {
  free(pointer)
})

export class Pointer {
  static NULL = 0

  /**
   * Free raw pointer
   * @param {number} pointer
   */
  static free(pointer) {
    if (pointer === Pointer.NULL) return
    free(pointer)
  }

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

    if (pointer == null && this.#size > 0) {
      this.#pointer = malloc(this.#size)
      if (this.isNull()) throw new NullError('Failed to allocate memory')
    } else {
      this.#pointer = pointer ?? Pointer.NULL
    }

    if (!(this.isNull() || this.isManaged())) MemoryRegistry.register(this, this.#pointer, this)
  }

  /**
   * Get underlining raw pointer
   *
   * @returns {number}
   */
  get raw() {
    return this.#pointer
  }

  /**
   * Get possible allocated size for pointer
   *
   * .. note::
   *    This can be null if pointer is externally managed
   *
   * .. note::
   *    This will be zero when pointer is NULL
   *
   * @returns {number?}
   */
  get size() {
    return this.isManaged() ? null : this.#size
  }

  /**
   * Fill memory with data
   *
   * .. note::
   *    When grow is false, this method throws when trying to fill a Pointer.NULL pointer,
   *    otherwise it will realloc the Pointer so it can fit the given data
   *
   * @param {bigint | number | string | ArrayLike.<number> | ArrayBufferLike} data to copy to memory
   * @param {boolean} [grow=false] Wheter to alloc more data to make sure data fits inside {@link Pointer}
   * @returns {Pointer}
   */
  fill(data, grow = false) {
    if (this.isManaged()) throw new Error("Can't modify managed Pointer")

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

    if (this.isNull()) throw new NullError('Failed to fill due to Pointer.NULL')

    lib.HEAP8.set(array, this.#pointer)

    return this
  }

  /**
   * Copy data from WASM memory and return it
   *
   * @param {number} [size] How much to read from memory
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

    if (this.isNull()) {
      throw new NullError('failed to read due to Pointer.NULL')
    } else if (this.isManaged()) {
      throw new Error('Reading managed pointer')
    }

    return lib.HEAP_DATA_VIEW.buffer.slice(this.#pointer, this.#pointer + size)
  }

  /**
   * Free internal pointer
   */
  free() {
    if (!this.isManaged()) {
      this.#size = 0
      Pointer.free(this.#pointer)
      MemoryRegistry.unregister(this)
    }

    this.#pointer = Pointer.NULL
  }

  isNull() {
    return this.#pointer === Pointer.NULL
  }

  /**
   * Change pointer size
   *
   * @param {number} size New pointer size, 0 frees the pointer
   * @returns {Pointer}
   */
  realloc(size, avoidShrinking = false) {
    if (size < 0) throw new Error('Size must be >= 0')

    if (this.isManaged() || size === this.#size || (avoidShrinking && size < this.#size))
      return this

    /** @type {number} */
    let pointer
    if (size > 0) {
      pointer = malloc(size)
      if (pointer === Pointer.NULL) throw new NullError('Failed to allocate memory')

      if (!this.isNull()) {
        lib.HEAP8.copyWithin(pointer, this.#pointer, this.#pointer + Math.min(size, this.#size))
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

  isManaged() {
    return this.#size === 0 && !this.isNull()
  }
}
