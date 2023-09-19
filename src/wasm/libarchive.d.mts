// Modified version of @types/emscripten to match only what our WASM build exports

// Type definitions for Emscripten 1.39.16
// Project: https://emscripten.org
// Definitions by: Kensuke Matsuzaki <https://github.com/zakki>
//                 Periklis Tsirakidis <https://github.com/periklis>
//                 Bumsik Kim <https://github.com/kbumsik>
//                 Louis DeScioli <https://github.com/lourd>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.2

declare namespace Emscripten {
  type JSType = 'number' | 'string' | 'array' | 'boolean'

  interface CCallOpts {
    async?: boolean | undefined
  }
}

// https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html
type StringToType<R> = R extends Emscripten.JSType
  ? {
      number: number | bigint
      string: string
      array: number[] | string[] | boolean[] | Uint8Array | Int8Array
      boolean: boolean
      null: null
    }[R]
  : never

type ArgsToType<T extends Array<Emscripten.JSType | null>> = Extract<
  {
    [P in keyof T]: StringToType<T[P]>
  },
  unknown[]
>

type ReturnToType<R extends Emscripten.JSType | null> = R extends null
  ? null
  : StringToType<Exclude<R, null>>

export const wasm: {
  HEAP8: Int8Array
  HEAP16: Int16Array
  HEAP32: Int32Array
  HEAPU8: Uint8Array
  HEAPU16: Uint16Array
  HEAPU32: Uint32Array
  HEAPF32: Float32Array
  HEAPF64: Float64Array
  HEAP64: BigInt64Array
  HEAPU64: BigUint64Array
  HEAP_DATA_VIEW: DataView

  ready: Promise<EmscriptenModule>
  calledRun: boolean
  thisProgram: string

  cwrap<I extends Array<Emscripten.JSType | null> | [], R extends Emscripten.JSType | null>(
    ident: string,
    returnType: R,
    argTypes: I,
    opts?: Emscripten.CCallOpts
  ): (...arg: ArgsToType<I>) => ReturnToType<R>
  inspect(): string
  locateFile(url: string, scriptDirectory: string): string
}
