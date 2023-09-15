# Archive-Wasm

**[LibArchive](https://github.com/libarchive/libarchive/tree/v3.7.2) compiled to WASM with an idiomatic JavaScript API for extracting most archive files**

> Inspired by [libarchivejs](https://github.com/nika-begiashvili/libarchivejs)

## Introduction

Archive-Wasm provides a WebAssembly (WASM) version of [LibArchive](https://github.com/libarchive/libarchive/tree/v3.7.2) to be used in NodeJS and the Browser, alongside a idiomatic JS API, that allows you to extract most archive formats effortlessly.

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
import { extract, EntryType } from 'archive-wasm'

// Load your archive data as an ArrayBuffer or any compatible Buffer type.
const archiveData = new Uint8Array([
  /** Archive Data */
])

for (const entry of extract(archiveData)) {
  if (entry.type === EntryType.FILE && entry.path.endsWith('lyrics.txt')) {
    console.log(`Found lyrics file: ${entry.path}, size: ${entry.size}`)
    console.log(new TextDecoder().decode(entry.data))
  }
}
```

## Supported Archives Types

- LZ4
- LZO
- LZMA
- ZSTD
- ZLIB
- BZip2

## API

### `extract(data: ArrayBufferLike, passphrase?: string | undefined): Generator<ArchiveEntry, void, unknown>`

Extracts entries from an archive.

- `data`: The archive data as an `ArrayBuffer`.
- `passphrase` (optional): A passphrase to use for encrypted archives.

Returns a generator that yields objects representing archive entries with the following properties:

- `size`: Size of the entry in bytes.
- `path`: Path of the entry within the archive.
- `type`: Type of the entry (`EntryType`).
- `data`: An `ArrayBuffer` containing the entry's data.

### `EntryType`

An enum that defines entry types:

- `EntryType.FILE`
- `EntryType.SYMBOLIC_LINK`
- `EntryType.SOCKET`
- `EntryType.CHARACTER_DEVICE`
- `EntryType.BLOCK_DEVICE`
- `EntryType.DIR`
- `EntryType.NAMED_PIPE`

## Contributing

Feel free to send PRs and open issues.

## TODO

- Add browser tests
- Add test with encryptes files
- Add tests with all supported formats

## License

This project is licensed under the GNU General Public License v3.0 or later - see the [LICENSE](LICENSE) file for details.
