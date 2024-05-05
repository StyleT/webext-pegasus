import type {PegasusMessage} from './types';
import type {InternalBroadcastEvent} from './types-internal';
import type {JsonValue} from 'type-fest';

import browser from 'webextension-polyfill';

const eventListeners = new Map<
  string,
  Array<(message: PegasusMessage<JsonValue>) => void>
>();
let globalCallback: ((message: InternalBroadcastEvent) => void) | null = null;

browser.runtime.onMessage.addListener((message: InternalBroadcastEvent) => {
  if (message.messageType !== 'PegasusEvent') {
    return;
  }

  const listeners = eventListeners.get(message.eventID);
  if (listeners == null) {
    return;
  }

  for (const listener of listeners) {
    listener({
      data: message.data,
      id: message.eventID,
      sender: message.sender,
      timestamp: message.timestamp,
    });
  }
  globalCallback?.(message);
});

export function withExtensionEvents(
  globalCallbackFn: (message: InternalBroadcastEvent) => void,
) {
  function onBroadcastEvent<Data extends JsonValue>(
    eventID: string,
    callback: (message: PegasusMessage<Data>) => void,
  ): () => void {
    const listeners = eventListeners.get(eventID) ?? [];
    listeners.push(callback as (message: PegasusMessage<JsonValue>) => void);
    eventListeners.set(eventID, listeners);
    globalCallback = globalCallbackFn;

    return () => {
      const existingListeners = eventListeners.get(eventID) ?? [];
      const index = existingListeners.indexOf(
        callback as (message: PegasusMessage<JsonValue>) => void,
      );
      if (index !== -1) {
        existingListeners.splice(index, 1);
      }
      eventListeners.set(eventID, existingListeners);
    };
  }

  return {
    emitBroadcastEvent: () => {
      throw new Error('Not implemented');
    },
    onBroadcastEvent,
  };
}
