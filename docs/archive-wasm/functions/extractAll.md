[**archive-wasm**](../../README.md) • **Docs**

---

# Function: extractAll()

> **extractAll**(`data`, `opts`?): [`Entry`](../interfaces/Entry.md)[]

Uncompress all entries in an archive

> This function is the preferred choice over `extract` when your use case
> involves accessing the content data of all entries within the archive,
> and memory usage is not a critical concern. It provides a performance
> advantage for this specific scenario by circumventing certain workarounds
> required to support random-time access to an entry's data within
> LibArchive's streaming process model. If your goal is to process all
> entries and retrieve their content, `extractAll` is the recommended method

## Parameters

• **data**: `ArrayBufferLike`

Archive's data

• **opts?**: `string` \| [`ExtractAllOpts`](../type-aliases/ExtractAllOpts.md)

Extract options, string value will be interpreted as password

## Returns

[`Entry`](../interfaces/Entry.md)[]

List with all entries included in the archive
