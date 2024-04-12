import {JsonValue} from 'type-fest';

export type RuntimeContext =
  | 'devtools'
  | 'background'
  | 'popup'
  | 'options'
  | 'content-script'
  | 'window';

export interface Endpoint {
  context: RuntimeContext;
  tabId: number;
  frameId?: number;
}

export type Destination = Endpoint | RuntimeContext | string;

export interface PegasusRPCMessage {
  sender: Endpoint;
  id: string;
  timestamp: number;
}

/**
 * Tail<T> returns a tuple with the first element removed
 * so Tail<[1, 2, 3]> is [2, 3]
 * (works by using rest tuples)
 */
type Tail<T> = T extends [unknown, ...infer TailType] ? TailType : T;

/**
 * Head<T> returns first element type
 * so Head<[1, 2, 3]> is 1
 * (works by using rest tuples)
 */
type Head<T> = T extends [infer HeadType, ...unknown[]] ? HeadType : T;

/**
 * Proimsify<T> returns Promise<T> if it is not a promise, otherwise it returns T.
 */
type Proimsify<T> = T extends Promise<unknown> ? T : Promise<T>;

/**
 * A type that ensures a service has only async methods.
 * - ***If all methods are async***, it returns the original type.
 * - ***If the service has non-async methods***, it returns a `DeepAsync` of the service.
 */
export type PegasusRPCService<TService> = TService extends DeepAsync<TService>
  ? TService
  : DeepAsync<TService>;

/**
 * A recursive type that deeply converts all methods in `TService` to be async.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DeepAsync<TService> = TService extends (...args: any) => unknown
  ? ToAsyncFunction<TService>
  : // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TService extends {[key: string]: any}
  ? {
      [fn in keyof TService]: DeepAsync<TService[fn]>;
    }
  : never;

type ToAsyncFunction<T extends (...args: unknown[]) => unknown> = (
  ...args: Tail<Parameters<T>>
) => Proimsify<ReturnType<T>>;

type Unpacked<T> = T extends Array<infer U>
  ? U
  : T extends ReadonlyArray<infer U>
  ? U
  : T;

type GoodFuncParamType = JsonValue | unknown;

type GoodFuncReturnType = Promise<JsonValue> | JsonValue | void | Promise<void>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoodParamsHead<T> = Head<T> extends PegasusRPCMessage ? any : unknown;

type GoodParamsTail<T> = Tail<T> extends []
  ? GoodParamsHead<T>
  : [Exclude<Unpacked<Tail<T>>, GoodFuncParamType>] extends [never]
  ? GoodParamsHead<T>
  : unknown;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoodParams<T> = T extends GoodParamsHead<T> ? GoodParamsTail<T> : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoodFunc<T extends (...args: any) => any> = (
  ...args: GoodParams<Parameters<T>>[]
) => GoodFuncReturnType;

type IPegasusRPCServiceInternal<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof T]: T[K] extends (...args: any) => any ? GoodFunc<T[K]> : never;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IPegasusRPCService<T> = T extends (...args: any) => any
  ? GoodFunc<T>
  : IPegasusRPCServiceInternal<T>;
