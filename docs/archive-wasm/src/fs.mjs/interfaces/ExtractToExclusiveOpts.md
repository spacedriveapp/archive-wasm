[**archive-wasm**](../../../../README.md)

---

# Interface: ExtractToExclusiveOpts

## Properties

### chmod?

> `optional` **chmod**: `number`

Permission flag to be AND'ed to all extracted entires permissions (The oposite of umask)

---

### overwrite?

> `optional` **overwrite**: `boolean`

Allow overwriting files

---

### sizeLimit?

> `optional` **sizeLimit**: `null` \| `bigint`

Limit the total byte size of data to be extracted to avoid memory exhaustion, null means no limit (default: 128MB)
