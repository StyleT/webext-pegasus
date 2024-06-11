import {JsonValue} from 'type-fest';

import {
  Endpoint,
  TransportBroadcastEventAPI,
  TransportMessagingAPI,
} from './types';

export interface TransportAPI
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extends TransportMessagingAPI,
    TransportBroadcastEventAPI {}

export interface InternalPacket {
  origin: Endpoint;
  messageType: 'message' | 'reply' | 'broadcastEvent';
  timestamp: number;
  hops: string[];
  id: string;
  transactionId: string;
}

export interface InternalBroadcastEvent extends InternalPacket {
  messageType: 'broadcastEvent';
  data: JsonValue;
}

export interface InternalMessage extends InternalPacket {
  destination: Endpoint;
  messageType: 'message' | 'reply';
  err?: JsonValue;
  data?: JsonValue | void;
}

export interface EndpointWontRespondError {
  type: 'error';
  transactionID: string;
}

/**
 * Call to ensure an active listener has been removed.
 *
 * If the listener has already been removed with `Messenger.removeAllListeners`, this is a noop.
 */
export type RemoveListenerCallback = () => void;

/**
 * Either a Promise of a type, or that type directly. Used to indicate that a method can by sync or
 * async.
 */
export type MaybePromise<T> = Promise<T> | T;

/**
 * Given a function declaration, `ProtocolWithReturn`, or a value, return the message's data type.
 */
export type GetMessageProtocolDataType<T> = T extends (
  ...args: infer Args
) => // eslint-disable-next-line @typescript-eslint/no-explicit-any
any
  ? Args['length'] extends 0 | 1
    ? Args[0]
    : never
  : // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends any
  ? T
  : never;

/**
 * Given a function declaration, `ProtocolWithReturn`, or a value, return the message's return type.
 */
export type GetMessageProtocolReturnType<T> = T extends (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => infer R
  ? R
  : void;

/**
 * Proimsify<T> returns Promise<T> if it is not a promise, otherwise it returns T.
 */
export type Proimsify<T> = T extends Promise<unknown> ? T : Promise<T>;
