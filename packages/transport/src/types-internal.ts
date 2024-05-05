import {JsonValue} from 'type-fest';

import {Endpoint} from './types';

export interface InternalPacket {
  origin: Endpoint;
  messageType: 'message' | 'reply' | 'broadcastEvent';
  timestamp: number;
  hops: string[];
  id: string;
}

export interface InternalBroadcastEvent extends InternalPacket {
  messageType: 'broadcastEvent';
  data: JsonValue;
}

export interface InternalMessage extends InternalPacket {
  destination: Endpoint;
  transactionId: string;
  messageType: 'message' | 'reply';
  err?: JsonValue;
  data?: JsonValue | void;
}

export interface EndpointWontRespondError {
  type: 'error';
  transactionID: string;
}
