import type {Jsonify, JsonValue} from 'type-fest';

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

export interface PegasusMessage<T extends JsonValue> {
  sender: Endpoint;
  id: string;
  data: T;
  timestamp: number;
}

export type OnMessageCallback<T extends JsonValue, R = void | JsonValue> = (
  message: PegasusMessage<T>,
) => R | Promise<R>;

export interface TransportMessagingAPI {
  /**
   * Sends a message to some other part of your extension.
   *
   * Notes:
   * - If there is no listener on the other side an error will be thrown where sendMessage was called.
   * - Listener on the other may want to reply. Get the reply by awaiting the returned Promise
   * - An error thrown in listener callback (in the destination context) will behave as usual, that is, bubble up, but the same error will also be thrown where sendMessage was called
   * - If the listener receives the message but the destination disconnects (tab closure for exmaple) before responding, sendMessage will throw an error in the sender context.
   */
  sendMessage: <
    ReturnType extends JsonValue,
    K extends DataTypeKey = DataTypeKey,
  >(
    messageID: K,
    data: GetDataType<K, JsonValue>,
    destination?: Destination,
  ) => Promise<GetReturnType<K, ReturnType>>;
  /**
   * Register one and only one listener, per messageId per context. That will be called upon sendMessage from other side.
   * Optionally, send a response to sender by returning any value or if async a Promise.
   */
  onMessage: <Data extends JsonValue, K extends DataTypeKey = DataTypeKey>(
    messageID: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: OnMessageCallback<GetDataType<K, Data>, GetReturnType<K, any>>,
  ) => () => void;
}

export interface TransportBroadcastEventAPI {
  /**
   * Broadcast Channel API alternative for browser extensions
   * Allows basic communication between extension contexts (that is, windows, popups, devtools, content-scripts, background, etc...)
   */
  onBroadcastEvent: <Data extends JsonValue>(
    eventID: string,
    callback: (event: PegasusMessage<Data>) => void,
  ) => () => void;
  /**
   * Broadcast Channel API alternative for browser extensions
   * Allows basic communication between extension contexts (that is, windows, popups, devtools, content-scripts, background, etc...)
   *
   * Emits an event, which can be of any kind of serialazible Object, to "every" listener in any extension context with the same extension.
   */
  emitBroadcastEvent: <Data extends JsonValue>(
    eventID: string,
    data: Data,
  ) => Promise<void>;
}

export interface TransportAPI extends TransportMessagingAPI, TransportBroadcastEventAPI {}

declare const ProtocolWithReturnSymbol: unique symbol;

export interface ProtocolWithReturn<Data, Return> {
  data: Jsonify<Data>;
  return: Jsonify<Return>;
  /**
   * Type differentiator only.
   */
  [ProtocolWithReturnSymbol]: true;
}

/**
 * Extendable by user.
 */
export interface ProtocolMap {
  // foo: { id: number, name: string }
  // bar: ProtocolWithReturn<string, number>
}

export type DataTypeKey = keyof ProtocolMap extends never
  ? string
  : keyof ProtocolMap;

export type GetDataType<
  K extends DataTypeKey,
  Fallback extends JsonValue = null,
> = K extends keyof ProtocolMap
  ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ProtocolMap[K] extends (...args: infer Args) => any
    ? Args['length'] extends 0
      ? undefined
      : Args[0]
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ProtocolMap[K] extends ProtocolWithReturn<infer Data, any>
    ? Data
    : ProtocolMap[K]
  : Fallback;

export type GetReturnType<
  K extends DataTypeKey,
  Fallback extends JsonValue = null,
> = K extends keyof ProtocolMap
  ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ProtocolMap[K] extends (...args: any[]) => infer R
    ? R
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ProtocolMap[K] extends ProtocolWithReturn<any, infer Return>
    ? Return
    : void
  : Fallback;
