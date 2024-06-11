import browser from 'webextension-polyfill';

import {createBroadcastEventRuntime} from './src/BroadcastEventRuntime';
import {createMessageRuntime} from './src/MessageRuntime';
import {createPersistentPort} from './src/PersistentPort';
import {initTransportAPI} from './src/TransportAPI';
import {internalPacketTypeRouter} from './src/utils/internalPacketTypeRouter';

export function initPegasusTransport(): void {
  const port = createPersistentPort('popup');
  const messageRuntime = createMessageRuntime('popup', async (message) =>
    port.postMessage(message),
  );

  port.onMessage((packet) =>
    internalPacketTypeRouter(packet, {eventRuntime, messageRuntime}),
  );

  const eventRuntime = createBroadcastEventRuntime('popup', async (event) => {
    port.postMessage(event);
  });

  initTransportAPI({
    browser: browser,
    emitBroadcastEvent: eventRuntime.emitBroadcastEvent,
    onBroadcastEvent: eventRuntime.onBroadcastEvent,
    onMessage: messageRuntime.onMessage,
    sendMessage: messageRuntime.sendMessage,
  });
}
