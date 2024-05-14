import {
  InternalBroadcastEvent,
  InternalMessage,
  InternalPacket,
} from '../types-internal';

export function isInternalBroadcastEvent(
  packet: InternalPacket,
): packet is InternalBroadcastEvent {
  return packet.messageType === 'broadcastEvent';
}

export function isInternalMessage(
  packet: InternalPacket,
): packet is InternalMessage {
  return packet.messageType === 'message' || packet.messageType === 'reply';
}
