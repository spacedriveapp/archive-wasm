[**archive-wasm**](../../README.md)

---

# Function: extractAll()

> **extractAll**(`data`, `opts`?): [`Entry`](../interfaces/Entry.md)[]

Extracts all entries from an archive.

> This function is recommended over [extract](extract.md) if you need to retrieve and process the data
> from all entries within the archive and memory usage is not a concern. It improves performance
> by skipping certain workarounds required for random access to an entry’s data in LibArchive’s
> streaming model. If your use case involves accessing all entries and their content, choose
> extractAll for optimal performance.

## Parameters

### data

The archive’s data.

`ArrayBufferLike` | `ArrayBufferView`\<`ArrayBufferLike`\>

### opts?

Extraction options, or a string interpreted as a password.

`string` | [`ExtractAllOpts`](../type-aliases/ExtractAllOpts.md)

## Returns

[`Entry`](../interfaces/Entry.md)[]

A list of entries from the archive.
