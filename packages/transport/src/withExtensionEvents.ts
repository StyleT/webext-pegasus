import type {JsonValue} from 'type-fest';

import browser from 'webextension-polyfill';

import {EventData} from './getMessagingAPI';

const eventListeners = new Map<string, Array<(message: JsonValue) => void>>();
let globalCallback: ((message: EventData) => void) | null = null;

browser.runtime.onMessage.addListener((message: EventData) => {
  if (message.messageType !== 'PegasusEvent') {
    return;
  }

  const listeners = eventListeners.get(message.eventID);
  if (listeners == null) {
    return;
  }

  for (const listener of listeners) {
    listener(message.data);
  }
  globalCallback?.(message);
});

export function withExtensionEvents(
  globalCallbackFn: (message: EventData) => void,
) {
  function onEvent<Message extends JsonValue = JsonValue>(
    eventID: string,
    callback: (message: Message) => void,
  ): () => void {
    const listeners = eventListeners.get(eventID) ?? [];
    listeners.push(callback as (message: JsonValue) => void);
    eventListeners.set(eventID, listeners);
    globalCallback = globalCallbackFn;

    return () => {
      const existingListeners = eventListeners.get(eventID) ?? [];
      const index = existingListeners.indexOf(
        callback as (message: JsonValue) => void,
      );
      if (index !== -1) {
        existingListeners.splice(index, 1);
      }
      eventListeners.set(eventID, existingListeners);
    };
  }

  return {
    emitEvent: () => {
      throw new Error('Not implemented');
    },
    onEvent,
  };
}
