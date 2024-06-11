import {getTransportAPI} from './TransportAPI';
import {TransportBroadcastEventAPI} from './types-internal';

declare const MissingProtocolMap: unique symbol;
type MissingProtocolMapType = typeof MissingProtocolMap;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PegasusMessagingReturnType<TProtocolMap extends Record<string, any>> = [
  TProtocolMap,
] extends [never]
  ? MissingProtocolMapType
  : TransportBroadcastEventAPI<TProtocolMap>;

export function definePegasusEventBus<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TProtocolMap extends Record<string, any> = never,
>(): PegasusMessagingReturnType<TProtocolMap> {
  const {onBroadcastEvent, emitBroadcastEvent} = getTransportAPI();

  return {
    emitBroadcastEvent,
    onBroadcastEvent,
  } as PegasusMessagingReturnType<TProtocolMap>;
}
