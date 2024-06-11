import type {JsonValue} from 'type-fest';

import {
  GetMessageProtocolDataType,
  GetMessageProtocolReturnType,
  MaybePromise,
  Proimsify,
  RemoveListenerCallback,
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
