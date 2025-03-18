[**archive-wasm**](../../../../README.md)

---

# Interface: ExtractToExclusiveOpts

## Properties

### chmod?

> `optional` **chmod**: `number`

Permission flag to be AND'ed to all extracted entires permissions (The oposite of umask)

---

### excluded?

> `optional` **excluded**: `null` \| `RegExp`[]

List of regex patterns to filter which entries should be ignored

---

### included?

> `optional` **included**: `null` \| `RegExp`[]

List of regex patterns to filter which entries should be extracted

---

### overwrite?

> `optional` **overwrite**: `boolean`

Allow overwriting files

---

### sizeLimit?

> `optional` **sizeLimit**: `null` \| `bigint`

Limit the total byte size of data to be extracted to avoid memory exhaustion, null means no limit (default: 128MB)
