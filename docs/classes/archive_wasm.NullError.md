# Class: NullError

[archive-wasm](../modules/archive_wasm.md).NullError

## Hierarchy

- [`ArchiveError`](archive_wasm.ArchiveError.md)

  ↳ **`NullError`**

## Constructors

### constructor

• **new NullError**(`message?`): [`NullError`](archive_wasm.NullError.md)

#### Parameters

| Name       | Type     | Description   |
| :--------- | :------- | :------------ |
| `message?` | `string` | Error message |

#### Returns

[`NullError`](archive_wasm.NullError.md)

#### Overrides

[ArchiveError](archive_wasm.ArchiveError.md).[constructor](archive_wasm.ArchiveError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[ArchiveError](archive_wasm.ArchiveError.md).[cause](archive_wasm.ArchiveError.md#cause)

---

### code

• **code**: `number`

#### Inherited from

[ArchiveError](archive_wasm.ArchiveError.md).[code](archive_wasm.ArchiveError.md#code)

---

### message

• **message**: `string`

#### Inherited from

[ArchiveError](archive_wasm.ArchiveError.md).[message](archive_wasm.ArchiveError.md#message)

---

### name

• **name**: `string`

#### Inherited from

[ArchiveError](archive_wasm.ArchiveError.md).[name](archive_wasm.ArchiveError.md#name)

---

### stack

• `Optional` **stack**: `string`

#### Inherited from

[ArchiveError](archive_wasm.ArchiveError.md).[stack](archive_wasm.ArchiveError.md#stack)

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

[ArchiveError](archive_wasm.ArchiveError.md).[prepareStackTrace](archive_wasm.ArchiveError.md#preparestacktrace)

---

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[ArchiveError](archive_wasm.ArchiveError.md).[stackTraceLimit](archive_wasm.ArchiveError.md#stacktracelimit)

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

[ArchiveError](archive_wasm.ArchiveError.md).[captureStackTrace](archive_wasm.ArchiveError.md#capturestacktrace)
