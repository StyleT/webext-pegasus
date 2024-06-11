/* eslint-disable @typescript-eslint/no-unused-vars */
import {getTransportAPI} from './TransportAPI';
import {TransportMessagingAPI} from './types-internal';

declare const MissingProtocolMap: unique symbol;
type MissingProtocolMapType = typeof MissingProtocolMap;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PegasusMessagingReturnType<TProtocolMap extends Record<string, any>> = [
  TProtocolMap,
] extends [never]
  ? MissingProtocolMapType
  : TransportMessagingAPI<TProtocolMap>;

export function definePegasusMessageBus<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TProtocolMap extends Record<string, any> = never,
>(): PegasusMessagingReturnType<TProtocolMap> {
  const {onMessage, sendMessage} = getTransportAPI();

  return {onMessage, sendMessage} as PegasusMessagingReturnType<TProtocolMap>;
}
