# Module: archive-wasm

**`File`**

Idiomatic JavaScript API for extracting most archive files with LibArchive

## Enumerations

- [EntryTypeName](../enums/archive_wasm.EntryTypeName.md)

## Classes

- [ArchiveError](../classes/archive_wasm.ArchiveError.md)
- [ExceedSizeLimitError](../classes/archive_wasm.ExceedSizeLimitError.md)
- [FailedError](../classes/archive_wasm.FailedError.md)
- [FatalError](../classes/archive_wasm.FatalError.md)
- [FileReadError](../classes/archive_wasm.FileReadError.md)
- [NullError](../classes/archive_wasm.NullError.md)
- [PassphraseError](../classes/archive_wasm.PassphraseError.md)
- [RetryError](../classes/archive_wasm.RetryError.md)

## Interfaces

- [Entry](../interfaces/archive_wasm.Entry.md)
- [ExtractAllExclusiveOpts](../interfaces/archive_wasm.ExtractAllExclusiveOpts.md)
- [ExtractOpts](../interfaces/archive_wasm.ExtractOpts.md)

## Type Aliases

### ExtractAllOpts

Ƭ **ExtractAllOpts**\<\>: [`ExtractOpts`](../interfaces/archive_wasm.ExtractOpts.md) & [`ExtractAllExclusiveOpts`](../interfaces/archive_wasm.ExtractAllExclusiveOpts.md)

## Functions

### disableWarning

▸ **disableWarning**(): `void`

Disable lib warnings

#### Returns

`void`

---

### extract

▸ **extract**(`data`, `opts?`): `Generator`\<[`Entry`](../interfaces/archive_wasm.Entry.md), `void`, `void`\>

Uncompress archive and iterate through all it's entries

#### Parameters

| Name    | Type                                                                   | Description                                                   |
| :------ | :--------------------------------------------------------------------- | :------------------------------------------------------------ |
| `data`  | `ArrayBufferLike`                                                      | Archive's data                                                |
| `opts?` | `string` \| [`ExtractOpts`](../interfaces/archive_wasm.ExtractOpts.md) | Extract options, string value will be interpreted as password |

#### Returns

`Generator`\<[`Entry`](../interfaces/archive_wasm.Entry.md), `void`, `void`\>

Generator that iterate through all of the archive's entries

**`Yields`**

---

### extractAll

▸ **extractAll**(`data`, `opts?`): [`Entry`](../interfaces/archive_wasm.Entry.md)[]

Uncompress all entries in an archive

> This function is the preferred choice over `extract` when your use case
> involves accessing the content data of all entries within the archive,
> and memory usage is not a critical concern. It provides a performance
> advantage for this specific scenario by circumventing certain workarounds
> required to support random-time access to an entry's data within
> LibArchive's streaming process model. If your goal is to process all
> entries and retrieve their content, `extractAll` is the recommended method

#### Parameters

| Name    | Type                                                           | Description                                                   |
| :------ | :------------------------------------------------------------- | :------------------------------------------------------------ |
| `data`  | `ArrayBufferLike`                                              | Archive's data                                                |
| `opts?` | `string` \| [`ExtractAllOpts`](archive_wasm.md#extractallopts) | Extract options, string value will be interpreted as password |

#### Returns

[`Entry`](../interfaces/archive_wasm.Entry.md)[]

List with all entries included in the archive
