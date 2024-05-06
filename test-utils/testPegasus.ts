import type {PegasusMessage} from '../packages/transport';

import {JsonValue} from 'type-fest';

import {initTransportAPI} from '../packages/transport/src/TransportAPI';
import {TransportAPI} from '../packages/transport/src/types';

const listeners: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEvent: Array<[string, event: (event: PegasusMessage<JsonValue>) => void]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMessage: Array<[string, (message: PegasusMessage<any>) => unknown]>;
} = {
  onEvent: [],
  onMessage: [],
};

const messagingAPI: TransportAPI = {
  emitBroadcastEvent: async (
    eventID: string,
    message: JsonValue,
  ): Promise<void> => {
    let sent = false;
    listeners.onEvent.forEach(([eventIDToCheck, cb]) => {
      if (eventIDToCheck === eventID) {
        cb({
          data: message,
          id: eventID,
          sender: {
            context: 'background',
            tabId: null,
          },
          timestamp: Date.now(),
        });
        sent = true;
      }
    });

    if (!sent) {
      throw new Error(`No listener found for eventID: ${eventID}`);
    }
  },
  onBroadcastEvent: <Data extends JsonValue>(
    eventID: string,
    callback: (event: PegasusMessage<Data>) => void,
  ): (() => void) => {
    listeners.onEvent.push([
      eventID,
      callback as (event: PegasusMessage<JsonValue>) => void,
    ]);

    return () => {
      const index = listeners.onEvent.findIndex(([, cb]) => cb === callback);
      if (index >= 0) {
        listeners.onEvent.splice(index, 1);
      }
    };
  },
  onMessage: (messageID: string, fn) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listeners.onMessage.push([
      messageID,
      fn as (message: PegasusMessage<any>) => unknown,
    ]);

    return () => {
      const index = listeners.onMessage.findIndex(([, cb]) => cb === fn);
      if (index >= 0) {
        listeners.onMessage.splice(index, 1);
      }
    };
  },
  sendMessage: async <RT = unknown>(
    messageID: string,
    data: JsonValue,
  ): Promise<RT> => {
    const message: PegasusMessage<object> = {
      data: data as object,
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
} as TransportAPI;

initTransportAPI(messagingAPI);

export const addPegasusEventHandler = messagingAPI.onBroadcastEvent;
export const addPegasusMessageHandler = messagingAPI.onMessage;
export const sendMessage = messagingAPI.sendMessage;
export const emitEvent = messagingAPI.emitBroadcastEvent;
export function resetPegasus() {
  listeners.onEvent = [];
  listeners.onMessage = [];
}
