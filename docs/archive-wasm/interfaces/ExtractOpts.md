[**archive-wasm**](../../README.md)

---

# Interface: ExtractOpts

## Properties

### baseDir?

> `optional` **baseDir**: `string`

Specifies a base directory to prepend to each extracted entry's path.

---

### encoding?

> `optional` **encoding**: `string`

The encoding used to parse entry metadata. Defaults to 'utf8'.

---

### exclude?

> `optional` **exclude**: `RegExp`[]

A list of RegExp patterns to filter entries that should be ignored.

---

### ignoreDotDir?

> `optional` **ignoreDotDir**: `boolean`

Indicates whether to ignore entries for '.' directories. Defaults to true.

---

### include?

> `optional` **include**: `RegExp`[]

A list of RegExp patterns to filter entries that should be extracted. An empty list means all entries are NOT included.

---

### normalize?

> `optional` **normalize**: `boolean`

Indicates whether to normalize extracted paths. Defaults to true.

---

### passphrase?

> `optional` **passphrase**: `string`

Passphrase for decrypting password-protected ZIP archives.

---

### recursive?

> `optional` **recursive**: `boolean`

Indicates whether to recursively extract archives within archives. Defaults to false.

---

### stripComponents?

> `optional` **stripComponents**: `number`

The number of leading path components to skip when extracting entries. Has no effect on absolute paths. The default is 0.
