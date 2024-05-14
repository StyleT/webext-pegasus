import type {BroadcastEventRuntime} from '../BroadcastEventRuntime';
import type {MessageRuntime} from '../MessageRuntime';
import type {InternalPacket} from '../types-internal';

import {
  isInternalBroadcastEvent,
  isInternalMessage,
} from './internalPacketTypeGuards';

export function internalPacketTypeRouter(
  packet: InternalPacket,
  {
    eventRuntime,
    messageRuntime,
  }: {eventRuntime: BroadcastEventRuntime; messageRuntime: MessageRuntime},
) {
  if (isInternalBroadcastEvent(packet)) {
    eventRuntime.handleEvent(packet);
  } else if (isInternalMessage(packet)) {
    messageRuntime.handleMessage(packet);
  } else {
    throw new TypeError('Unknown message type');
  }
}
