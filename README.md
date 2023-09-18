# Archive-Wasm

**[LibArchive](https://libarchive.org/) compiled to WASM with an idiomatic JavaScript API for extracting most archive files**

> Inspired by [libarchivejs](https://github.com/nika-begiashvili/libarchivejs)

## Introduction

Archive-Wasm provides a WebAssembly (WASM) version of [LibArchive](https://github.com/libarchive/libarchive/tree/v3.7.2) to be used in NodeJS and the Browser, alongside an idiomatic JS API, that allows you to effortlessly extract data from most archive formats.

## Installation

To use Archive-Wasm in your project, you can install it via npm:

`npm install archive-wasm`

## Environment Support

- NodeJS >= 18
- Chromium & Cia. >= 109
- Safari >= 15
- Firefox >= 115

## Usage

Here's a simple example of extracting data from an archive using Archive-Wasm:

```js
import { extract, getEntryType } from 'archive-wasm'

// Load your archive data as an ArrayBuffer or any compatible Buffer type.
const archiveData = new Uint8Array([/* Archive Data */])

for (const entry of extract(archiveData)) {
  if (getEntryType(entry) === 'FILE' && entry.path.endsWith('lyrics.txt')) {
    console.log(`Found lyrics file: ${entry.path}, size: ${entry.size}`)
    console.log(new TextDecoder().decode(entry.data))
  }
}
```

## Supported Archives Types

Archive-Wasm supports the same archive formats as the full version of [LibArchive](https://libarchive.org/), with the exception of the xar format and grzip/lrzip compressions:

- Reads a variety of formats, including tar, pax, cpio, zip, lha, ar, cab, mtree, rar, and ISO images.
- Automatically handles archives compressed with compress, bzip2, gzip, lz4, lzip, lzop, lzma/xz, zstd.

### Encrypted formats

Only encrypted zip is supported in [LibArchive](https://github.com/libarchive/libarchive/blob/v3.7.2/tar/bsdtar.1#L745), other encrypted formats will throw an error during either the decoding step or when trying to read the actual file data, depending on how they implement encryption.

## API

### `extract(data: ArrayBufferLike, passphrase?: string | undefined): Generator<Entry, void, unknown>`

Extracts entries from an archive.

- `data`: The archive data as an `ArrayBuffer`.
- `passphrase` (optional): Passphrase to decrypt protected zip files.

Returns a generator that yields objects representing archive entries with the following properties:

- `size`: Size of the entry in bytes.
- `mode`: A bit-field describing the file type and mode.
- `path`: Path of the entry within the archive.
- `data`: An `ArrayBuffer` containing the entry's data.
- `atime`: The timestamp indicating the last time this file was accessed expressed in nanoseconds since the POSIX Epoch.
- `ctime`: The timestamp indicating the last time the file status was changed expressed in nanoseconds since the POSIX Epoch.
- `mtime`: The timestamp indicating the last time this file was modified expressed in nanoseconds since the POSIX Epoch.
- `birthtime`: The timestamp indicating the creation time of this file expressed in nanoseconds since the POSIX Epoch.

### `extractAll(data: ArrayBufferLike, passphrase?: string | undefined): Entry[]`

Uncompress all entries in an archive.

- `data`: The archive data as an `ArrayBuffer`.
- `passphrase` (optional): Passphrase to decrypt protected zip files.

Returns an array containing all the entries included in the archive.

> This function is the preferred choice over `extract` when your use case involves accessing the content data of all entries within the archive, and memory usage is not a critical concern. It provides a performance advantage for this specific scenario by circumventing certain workarounds required to support random-time access to an entry's data within LibArchive's streaming process model. If your goal is to process all entries and retrieve their content, `extractAll` is the recommended method.

### `getEntryType(entry: Entry): 'FILE' | 'NAMED_PIPE' | 'SOCKET' | 'DIR' | 'BLOCK_DEVICE' | 'SYMBOLIC_LINK' | 'CHARACTER_DEVICE'`

Parse an entry's mode to retrieve its type.

- `entry`: The archive entry.

Returns a string indicating the entry's type

## Contributing

Feel free to send PRs and open issues.

## TODO

- Add browser tests
- Handle extracting sparse entries

## License

Except where otherwise noted, all files in this project are licensed under the GNU General Public License v3.0 or later - see the [LICENSE](./LICENSE) file for details.
