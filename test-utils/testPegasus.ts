import type {BridgeMessage, OnMessageCallback} from '../packages/transport';

import {JsonValue} from 'type-fest';

import {
  type MessagingAPI,
  setMessagingAPI,
} from '../packages/transport/src/getMessagingAPI';

const listeners: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEvent: Array<[string, (message: any) => void]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMessage: Array<[string, OnMessageCallback<JsonValue, unknown>]>;
} = {
  onEvent: [],
  onMessage: [],
};

const messagingAPI: MessagingAPI = {
  emitEvent: async (eventID: string, message: JsonValue): Promise<void> => {
    let sent = false;
    listeners.onEvent.forEach(([eventIDToCheck, cb]) => {
      if (eventIDToCheck === eventID) {
        cb(message);
        sent = true;
      }
    });

    if (!sent) {
      throw new Error(`No listener found for eventID: ${eventID}`);
    }
  },
  onEvent: <M extends JsonValue>(
    messageID: string,
    fn: (message: M) => void,
  ) => {
    listeners.onEvent.push([messageID, fn]);

    return () => {
      const index = listeners.onEvent.findIndex(([, cb]) => cb === fn);
      if (index >= 0) {
        listeners.onEvent.splice(index, 1);
      }
    };
  },
  onMessage: (messageID, fn) => {
    listeners.onMessage.push([messageID, fn]);

    return () => {
      const index = listeners.onMessage.findIndex(([, cb]) => cb === fn);
      if (index >= 0) {
        listeners.onMessage.splice(index, 1);
      }
    };
  },
  sendMessage: async <RT = unknown>(
    messageID: string,
    payload: JsonValue,
  ): Promise<RT> => {
    const message: BridgeMessage<object> = {
      data: payload as object,
      id: '1',
      sender: {
        context: 'window',
        tabId: 1,
      },
      timestamp: Date.now(),
    };

    const relatedListeners = listeners.onMessage.filter(
      ([mID]) => mID === messageID,
    );

    if (relatedListeners.length > 1) {
      throw new Error(`Found more then 1 listener for messageID: ${messageID}`);
    }
    if (relatedListeners.length === 0) {
      throw new Error(`No listener found for messageID: ${messageID}`);
    }
    const [, cb] = relatedListeners[0];

    return cb(message) as RT;
  },
};

setMessagingAPI(messagingAPI);

export const addPegasusEventHandler = messagingAPI.onEvent;
export const addPegasusMessageHandler = messagingAPI.onMessage;
export const sendMessage = messagingAPI.sendMessage;
export const emitEvent = messagingAPI.emitEvent;
export function resetPegasus() {
  listeners.onEvent = [];
  listeners.onMessage = [];
}
