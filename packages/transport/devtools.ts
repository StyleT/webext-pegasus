import browser from 'webextension-polyfill';

import {createEndpointRuntime} from './src/endpoint-runtime';
import {setMessagingAPI} from './src/getMessagingAPI';
import {createPersistentPort} from './src/persistent-port';
import {withExtensionEvents} from './src/withExtensionEvents';

const eventChannel = withExtensionEvents(() => {});

export function initPegasusTransport(): void {
  const port = createPersistentPort(
    `devtools@${browser.devtools.inspectedWindow.tabId}`,
  );
  const endpointRuntime = createEndpointRuntime('devtools', (message) =>
    port.postMessage(message),
  );

  port.onMessage(endpointRuntime.handleMessage);

  setMessagingAPI({
    emitEvent: eventChannel.emitEvent,
    onEvent: eventChannel.onEvent,
    onMessage: endpointRuntime.onMessage,
    sendMessage: endpointRuntime.sendMessage,
  });
}
