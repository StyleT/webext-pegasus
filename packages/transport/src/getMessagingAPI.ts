import type {JsonValue} from 'type-fest';

import {Destination, OnMessageCallback} from 'webext-bridge';

type SendMessageFn = (
  messageID: string,
  data: JsonValue,
  destination?: Destination,
) => Promise<unknown>;

type OnMessageFn = (
  messageID: string,
  callback: OnMessageCallback<JsonValue, unknown>,
) => () => void;

export type EventData<Message extends JsonValue = JsonValue> = {
  messageType: 'PegasusEvent';
  eventID: string;
  data: Message;
};

export interface MessagingAPI {
  sendMessage: SendMessageFn;
  onMessage: OnMessageFn;
  onEvent: <Message extends JsonValue>(
    eventID: string,
    callback: (message: Message) => void,
  ) => () => void;
  emitEvent: <Message extends JsonValue>(
    eventID: string,
    message: Message,
  ) => Promise<void>;
}

let API: MessagingAPI | null = null;

export function setMessagingAPI(api: MessagingAPI): void {
  if (API != null) {
    throw new Error('Messaging API already set');
  }
  API = api;
}

export function getMessagingAPI(): MessagingAPI {
  if (API == null) {
    throw new Error("Messaging API wan't set");
  }

  return API;
}
