# Module: archive-wasm/src/fs.mjs

**`File`**

Utilities for extracting archives to disk using NodeJS's fs API

## Interfaces

- [ExtractToExclusiveOpts](../interfaces/archive_wasm_src_fs_mjs.ExtractToExclusiveOpts.md)

## Type Aliases

### ExtractToOpts

Ƭ **ExtractToOpts**\<\>: [`archive-wasm`](archive_wasm.md) & [`ExtractToExclusiveOpts`](../interfaces/archive_wasm_src_fs_mjs.ExtractToExclusiveOpts.md)

## Functions

### extractTo

▸ **extractTo**(`data`, `out`, `opts?`): `Promise`\<`void`\>

Extract all supported archive entries inside a given path

> Only files, directories, symlinks and hardlinks are supported.
> Any extra entry type, or invalid entry, in the archive will be skipped (with a warning printed to console)
> This function throws if it attempts to overwrite any existing file

#### Parameters

| Name    | Type                                                                    | Description                                                   |
| :------ | :---------------------------------------------------------------------- | :------------------------------------------------------------ |
| `data`  | `ArrayBufferLike`                                                       | Archive's data                                                |
| `out`   | `string`                                                                | Path where the archive entries will be extracted to           |
| `opts?` | `string` \| [`ExtractToOpts`](archive_wasm_src_fs_mjs.md#extracttoopts) | Extract options, string value will be interpreted as password |

#### Returns

`Promise`\<`void`\>
