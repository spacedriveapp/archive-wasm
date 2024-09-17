[**archive-wasm**](../../README.md) • **Docs**

---

# Function: extract()

> **extract**(`data`, `opts`?): `Generator`\<[`Entry`](../interfaces/Entry.md), `void`, `void`\>

Extract archive and iterate through all it's entries

## Parameters

• **data**: `ArrayBufferLike`

Archive's data

• **opts?**: `string` \| [`ExtractOpts`](../interfaces/ExtractOpts.md)

Extract options, string value will be interpreted as password

## Returns

`Generator`\<[`Entry`](../interfaces/Entry.md), `void`, `void`\>

Generator that iterate through all of the archive's entries

## Yields
