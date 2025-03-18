[**archive-wasm**](../../README.md)

---

# Function: extract()

> **extract**(`data`, `opts`?): `Generator`\<[`Entry`](../interfaces/Entry.md), `void`, `void`\>

Extract archive and iterate through all it's entries

## Parameters

### data

Archive's data

`ArrayBufferLike` | `ArrayBufferView`\<`ArrayBufferLike`\>

### opts?

Extract options, string value will be interpreted as password

`string` | [`ExtractOpts`](../interfaces/ExtractOpts.md)

## Returns

`Generator`\<[`Entry`](../interfaces/Entry.md), `void`, `void`\>

Generator that iterate through all of the archive's entries

## Yields
