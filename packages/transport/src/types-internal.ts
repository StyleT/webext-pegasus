import {JsonValue} from 'type-fest';

import {Endpoint} from './types';

export type InternalBroadcastEvent<Message extends JsonValue = JsonValue> = {
  messageType: 'PegasusEvent';
  eventID: string;
  data: Message;
  timestamp: number;
  sender: Endpoint;
};

export interface EndpointWontRespondError {
  type: 'error';
  transactionID: string;
}
