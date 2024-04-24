import type {BridgeMessage, OnMessageCallback} from '../packages/transport';

import {jest} from '@jest/globals';
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
    listeners.onEvent.forEach(([eventIDToCheck, cb]) => {
      if (eventIDToCheck === eventID) {
        cb(message);
      }
    });
  },
  onEvent: (messageID, fn) => {
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
  sendMessage: jest.fn(() => Promise.resolve()),
};

setMessagingAPI(messagingAPI);

export function addPegasusEventHandler(
  messageID: string,
  fn: (message: unknown) => void,
): () => void {
  return messagingAPI.onEvent(messageID, fn);
}

export async function sendMessage<RT = unknown>(
  messageID: string,
  payload: JsonValue,
): Promise<RT> {
  const message: BridgeMessage<object> = {
    data: {
      args: [payload],
      path: 'dispatch',
    },
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
}
