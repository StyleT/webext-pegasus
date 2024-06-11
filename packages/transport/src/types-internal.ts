import {JsonValue} from 'type-fest';
import {type Browser} from 'webextension-polyfill';

import {
  Destination,
  Endpoint,
  OnMessageCallback,
  PegasusMessage,
} from './types';

export interface TransportBrowserAPI {
  browser: Browser | null;
}

export interface TransportMessagingAPI<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TProtocolMap extends Record<string, any> = Record<string, any>,
> {
  /**
   * Sends a message to some other part of your extension.
   *
   * Notes:
   * - If there is no listener on the other side an error will be thrown where sendMessage was called.
   * - Listener on the other may want to reply. Get the reply by awaiting the returned Promise
   * - An error thrown in listener callback (in the destination context) will behave as usual, that is, bubble up, but the same error will also be thrown where sendMessage was called
   * - If the listener receives the message but the destination disconnects (tab closure for exmaple) before responding, sendMessage will throw an error in the sender context.
   */
  sendMessage: <TType extends keyof TProtocolMap>(
    messageID: TType,
    data: GetMessageProtocolDataType<TProtocolMap[TType]>,
    destination?: Destination,
  ) => Proimsify<GetMessageProtocolReturnType<TProtocolMap[TType]>>;
  /**
   * Register one and only one listener, per messageId per context. That will be called upon sendMessage from other side.
   * Optionally, send a response to sender by returning any value or if async a Promise.
   */
  onMessage: <TType extends keyof TProtocolMap>(
    messageID: TType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: OnMessageCallback<TProtocolMap, TType>,
  ) => RemoveListenerCallback;
}

export interface TransportBroadcastEventAPI<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TProtocolMap extends Record<string, any> = Record<string, any>,
> {
  /**
   * Broadcast Channel API alternative for browser extensions
   * Allows basic communication between extension contexts (that is, windows, popups, devtools, content-scripts, background, etc...)
   */
  onBroadcastEvent: <TType extends keyof TProtocolMap>(
    eventID: TType,
    callback: (event: PegasusMessage<TProtocolMap[TType]>) => void,
  ) => () => void;
  /**
   * Broadcast Channel API alternative for browser extensions
   * Allows basic communication between extension contexts (that is, windows, popups, devtools, content-scripts, background, etc...)
   *
   * Emits an event, which can be of any kind of serialazible Object, to "every" listener in any extension context with the same extension.
   */
  emitBroadcastEvent: <TType extends keyof TProtocolMap>(
    eventID: TType,
    data: TProtocolMap[TType],
  ) => Promise<void>;
}

export interface TransportAPI
  extends TransportMessagingAPI,
    TransportBroadcastEventAPI,
    TransportBrowserAPI {}

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
