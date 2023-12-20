# Class: ArchiveError

[archive-wasm](../modules/archive_wasm.md).ArchiveError

## Hierarchy

- `Error`

  ↳ **`ArchiveError`**

  ↳↳ [`NullError`](archive_wasm.NullError.md)

  ↳↳ [`RetryError`](archive_wasm.RetryError.md)

  ↳↳ [`FatalError`](archive_wasm.FatalError.md)

  ↳↳ [`FailedError`](archive_wasm.FailedError.md)

  ↳↳ [`FileReadError`](archive_wasm.FileReadError.md)

  ↳↳ [`PassphraseError`](archive_wasm.PassphraseError.md)

  ↳↳ [`ExceedSizeLimitError`](archive_wasm.ExceedSizeLimitError.md)

## Constructors

### constructor

• **new ArchiveError**(`code`, `message?`): [`ArchiveError`](archive_wasm.ArchiveError.md)

Main error class

#### Parameters

| Name       | Type     | Description   |
| :--------- | :------- | :------------ |
| `code`     | `number` | Error code    |
| `message?` | `string` | Error message |

#### Returns

[`ArchiveError`](archive_wasm.ArchiveError.md)

#### Overrides

Error.constructor

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

Error.cause

---

### code

• **code**: `number`

---

### message

• **message**: `string`

#### Inherited from

Error.message

---

### name

• **name**: `string`

#### Inherited from

Error.name

---

### stack

• `Optional` **stack**: `string`

#### Inherited from

Error.stack

---

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

#### Type declaration

▸ (`err`, `stackTraces`): `any`

Optional override for formatting stack traces

##### Parameters

| Name          | Type         |
| :------------ | :----------- |
| `err`         | `Error`      |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

Error.prepareStackTrace

---

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

Error.stackTraceLimit

## Methods

### captureStackTrace

▸ **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name              | Type       |
| :---------------- | :--------- |
| `targetObject`    | `object`   |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

Error.captureStackTrace
