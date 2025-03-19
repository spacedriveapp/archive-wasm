[**archive-wasm**](../../README.md)

---

# Function: extract()

> **extract**(`data`, `opts`?): `Generator`\<[`Entry`](../interfaces/Entry.md), `void`, `void`\>

Extract an archive and iterate through all its entries.

> Using the [ExtractOpts.baseDir](../interfaces/ExtractOpts.md#basedir) or [ExtractOpts.stripComponents](../interfaces/ExtractOpts.md#stripcomponents) option results
> in the entry’s path being normalized.

> The [ExtractOpts.stripComponents](../interfaces/ExtractOpts.md#stripcomponents), [ExtractOpts.include](../interfaces/ExtractOpts.md#include), and [ExtractOpts.exclude](../interfaces/ExtractOpts.md#exclude)
> options are always processed with a normalized version of the entry’s path, so there is no need
> to worry about edge cases. Also, they are applied before the [ExtractOpts.baseDir](../interfaces/ExtractOpts.md#basedir) option,
> so the base directory will not be affected by them.

> Using [ExtractOpts.recursive](../interfaces/ExtractOpts.md#recursive) can severely impact performance on large archives. It allows
> extracting nested archives (common in GitHub Action releases) but is limited to 16 levels of
> recursion. Formats such as `ar`, `empty`, `mtree`, and `cab` are disabled for inner extraction
> since they can treat nearly any file as an archive.

## Parameters

### data

The archive’s data.

`ArrayBufferLike` | `ArrayBufferView`\<`ArrayBufferLike`\>

### opts?

Extract options; a string value is interpreted as a password.

`string` | [`ExtractOpts`](../interfaces/ExtractOpts.md)

## Returns

`Generator`\<[`Entry`](../interfaces/Entry.md), `void`, `void`\>

A generator that iterates through all the archive’s entries.

## Yields
