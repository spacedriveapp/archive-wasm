[**archive-wasm**](../../README.md)

---

# Class: ArchiveError

## Extends

- `Error`

## Extended by

- [`NullError`](NullError.md)
- [`RetryError`](RetryError.md)
- [`FatalError`](FatalError.md)
- [`FailedError`](FailedError.md)
- [`FileReadError`](FileReadError.md)
- [`PassphraseError`](PassphraseError.md)
- [`ExceedSizeLimitError`](ExceedSizeLimitError.md)

## Constructors

### new ArchiveError()

> **new ArchiveError**(`code`, `message`?): `ArchiveError`

Main error class

#### Parameters

##### code

`number`

Error code

##### message?

`string`

Error message

#### Returns

`ArchiveError`

#### Overrides

`Error.constructor`

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

`Error.cause`

---

### code

> **code**: `number`

---

### message

> **message**: `string`

#### Inherited from

`Error.message`

---

### name

> **name**: `string`

#### Inherited from

`Error.name`

---

### stack?

> `optional` **stack**: `string`

#### Inherited from

`Error.stack`

---

### prepareStackTrace()?

> `static` `optional` **prepareStackTrace**: (`err`, `stackTraces`) => `any`

Optional override for formatting stack traces

#### Parameters

##### err

`Error`

##### stackTraces

`CallSite`[]

#### Returns

`any`

#### See

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

`Error.prepareStackTrace`

---

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

`Error.stackTraceLimit`

## Methods

### captureStackTrace()

> `static` **captureStackTrace**(`targetObject`, `constructorOpt`?): `void`

Create .stack property on a target object

#### Parameters

##### targetObject

`object`

##### constructorOpt?

`Function`

#### Returns

`void`

#### Inherited from

`Error.captureStackTrace`
