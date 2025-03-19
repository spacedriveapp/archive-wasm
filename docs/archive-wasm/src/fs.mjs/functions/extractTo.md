[**archive-wasm**](../../../../README.md)

---

# Function: extractTo()

> **extractTo**(`data`, `out`, `opts`?): `Promise`\<`void`\>

Extracts all supported archive entries to the specified directory.

> Only files, directories, symlinks, and hardlinks are supported.
> Any unsupported or invalid entries in the archive are skipped, with a warning printed to the
> console. If [ExtractToOpts.overwrite](../interfaces/ExtractToExclusiveOpts.md#overwrite) is disabled, this function will throws if it
> attempts to overwrite an existing file.

## Parameters

### data

The archive data.

`ArrayBufferLike` | `ArrayBufferView`\<`ArrayBufferLike`\>

### out

`string`

The path where the archive entries will be extracted.

### opts?

Extraction options. A string value is interpreted as the password.

`string` | [`ExtractToOpts`](../type-aliases/ExtractToOpts.md)

## Returns

`Promise`\<`void`\>
