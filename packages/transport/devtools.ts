import browser from 'webextension-polyfill';

import {createMessageRuntime} from './src/MessageRuntime';
import {createPersistentPort} from './src/PersistentPort';
import {initTransportAPI} from './src/TransportAPI';
import {withExtensionEvents} from './src/withExtensionEvents';

const eventChannel = withExtensionEvents(() => {});

export function initPegasusTransport(): void {
  const port = createPersistentPort(
    `devtools@${browser.devtools.inspectedWindow.tabId}`,
  );
  const messageRuntime = createMessageRuntime('devtools', (message) =>
    port.postMessage(message),
  );

  port.onMessage(messageRuntime.handleMessage);

  initTransportAPI({
    emitBroadcastEvent: eventChannel.emitBroadcastEvent,
    onBroadcastEvent: eventChannel.onBroadcastEvent,
    onMessage: messageRuntime.onMessage,
    sendMessage: messageRuntime.sendMessage,
  });
}
