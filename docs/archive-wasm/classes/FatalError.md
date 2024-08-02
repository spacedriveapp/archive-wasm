[**archive-wasm**](../../README.md) • **Docs**

---

# Class: FatalError

## Extends

- [`ArchiveError`](ArchiveError.md)

## Constructors

### new FatalError()

> **new FatalError**(`code`, `message`?): [`FatalError`](FatalError.md)

Main error class

#### Parameters

• **code**: `number`

Error code

• **message?**: `string`

Error message

#### Returns

[`FatalError`](FatalError.md)

#### Inherited from

[`ArchiveError`](ArchiveError.md).[`constructor`](ArchiveError.md#constructors)

## Properties

### cause?

> `optional` **cause**: `unknown`

#### Inherited from

[`ArchiveError`](ArchiveError.md).[`cause`](ArchiveError.md#cause)

---

### code

> **code**: `number`

#### Inherited from

[`ArchiveError`](ArchiveError.md).[`code`](ArchiveError.md#code)

---

### message

> **message**: `string`

#### Inherited from

[`ArchiveError`](ArchiveError.md).[`message`](ArchiveError.md#message)

---

### name

> **name**: `string`

#### Inherited from

[`ArchiveError`](ArchiveError.md).[`name`](ArchiveError.md#name)

---

### stack?

> `optional` **stack**: `string`

#### Inherited from

[`ArchiveError`](ArchiveError.md).[`stack`](ArchiveError.md#stack)

---

### prepareStackTrace()?

> `static` `optional` **prepareStackTrace**: (`err`, `stackTraces`) => `any`

Optional override for formatting stack traces

#### Parameters

• **err**: `Error`

• **stackTraces**: `CallSite`[]

#### Returns

`any`

#### See

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

[`ArchiveError`](ArchiveError.md).[`prepareStackTrace`](ArchiveError.md#preparestacktrace)

---

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

#### Inherited from

[`ArchiveError`](ArchiveError.md).[`stackTraceLimit`](ArchiveError.md#stacktracelimit)

## Methods

### captureStackTrace()

> `static` **captureStackTrace**(`targetObject`, `constructorOpt`?): `void`

Create .stack property on a target object

#### Parameters

• **targetObject**: `object`

• **constructorOpt?**: `Function`

#### Returns

`void`

#### Inherited from

[`ArchiveError`](ArchiveError.md).[`captureStackTrace`](ArchiveError.md#capturestacktrace)
