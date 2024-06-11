import type {JsonValue} from 'type-fest';

import {
  GetMessageProtocolDataType,
  GetMessageProtocolReturnType,
  MaybePromise,
} from './types-internal';

export type RuntimeContext =
  | 'devtools'
  | 'background'
  | 'popup'
  | 'options'
  | 'content-script'
  | 'window';

export interface Endpoint {
  context: RuntimeContext;
  tabId: number | null;
  frameId?: number;
}

export type Destination = Endpoint | RuntimeContext | string;

export interface PegasusMessage<TData extends JsonValue> {
  /**
   * The data that was passed into `sendMessage`
   */
  data: TData;
  id: string;
  timestamp: number;
  sender: Endpoint;
}

export type OnMessageCallback<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TProtocolMap extends Record<string, any> = Record<string, any>,
  TType extends keyof TProtocolMap = never,
> = (
  message: PegasusMessage<GetMessageProtocolDataType<TProtocolMap[TType]>>,
) => MaybePromise<GetMessageProtocolReturnType<TProtocolMap[TType]>>;
