import browser from 'webextension-polyfill';

import { createBroadcastEventRuntime } from './src/BroadcastEventRuntime';
import {createMessageRuntime} from './src/MessageRuntime';
import {createPersistentPort} from './src/PersistentPort';
import {initTransportAPI} from './src/TransportAPI';
import { InternalBroadcastEvent } from './src/types-internal';

export function initPegasusTransport(): void {
  const port = createPersistentPort('options');
  const messageRuntime = createMessageRuntime('options', async (message) =>
    port.postMessage(message),
  );

  port.onMessage(messageRuntime.handleMessage);

  const eventRuntime = createBroadcastEventRuntime('options', async (event) => {
    browser.runtime.sendMessage(event);
  });

  browser.runtime.onMessage.addListener((message: InternalBroadcastEvent) => {
    if (message.messageType === 'broadcastEvent') {
      eventRuntime.handleEvent(message);
    }
  });

  initTransportAPI({
    emitBroadcastEvent: eventRuntime.emitBroadcastEvent,
    onBroadcastEvent: eventRuntime.onBroadcastEvent,
    onMessage: messageRuntime.onMessage,
    sendMessage: messageRuntime.sendMessage,
  });
}
