# Interface: ExtractToExclusiveOpts\<\>

[archive-wasm/src/fs.mjs](../modules/archive_wasm_src_fs_mjs.md).ExtractToExclusiveOpts

## Properties

### chmod

• **chmod**: `undefined` \| `number`

Permission flag to be AND'ed to all extracted entires permissions (The oposite of umask)

---

### overwrite

• **overwrite**: `undefined` \| `boolean`

Allow overwriting files

---

### sizeLimit

• **sizeLimit**: `undefined` \| `null` \| `bigint`

Limit the total byte size of data to be extracted to avoid memory exhaustion, null means no limit (default: 128MB)
