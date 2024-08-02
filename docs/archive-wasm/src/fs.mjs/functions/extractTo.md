[**archive-wasm**](../../../../README.md) • **Docs**

---

# Function: extractTo()

> **extractTo**(`data`, `out`, `opts`?): `Promise`\<`void`\>

Extract all supported archive entries inside a given path

> Only files, directories, symlinks and hardlinks are supported.
> Any extra entry type, or invalid entry, in the archive will be skipped (with a warning printed to console)
> This function throws if it attempts to overwrite any existing file

## Parameters

• **data**: `ArrayBufferLike`

Archive's data

• **out**: `string`

Path where the archive entries will be extracted to

• **opts?**: `string` \| [`ExtractToOpts`](../type-aliases/ExtractToOpts.md)

Extract options, string value will be interpreted as password

## Returns

`Promise`\<`void`\>
