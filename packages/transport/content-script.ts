import type {EndpointWontRespondError, InternalMessage} from './src/types';

import {createEndpointRuntime} from './src/endpoint-runtime';
import {EventData, setMessagingAPI} from './src/getMessagingAPI';
import {createPersistentPort} from './src/persistent-port';
import {usePostMessaging} from './src/post-message';
import {withExtensionEvents} from './src/withExtensionEvents';

let windowMessagingNamespace: string | null = null;

const eventChannel = withExtensionEvents((message: EventData) => {
  if (windowMessagingNamespace === null) {
    return;
  }

  const windowEvent = new CustomEvent(
    `pegasusEvents/${windowMessagingNamespace}/${message.eventID}`,
    {
      detail: JSON.stringify(message.data),
    },
  );
  window.dispatchEvent(windowEvent);
});

type Props = {
  allowWindowMessagingForNamespace?: string;
};

export function initPegasusTransport({
  allowWindowMessagingForNamespace,
}: Props = {}): void {
  const win = usePostMessaging('content-script');
  const port = createPersistentPort();
  const endpointRuntime = createEndpointRuntime('content-script', (message) => {
    if (message.destination.context === 'window') {
      win.postMessage(message);
    } else {
      port.postMessage(message);
    }
  });

  win.onMessage((message: InternalMessage | EndpointWontRespondError) => {
    if ('type' in message && 'transactionID' in message) {
      endpointRuntime.endTransaction(message.transactionID);
    } else {
      endpointRuntime.handleMessage(
        Object.assign({}, message, {
          origin: {
            // a message event inside `content-script` means a script inside `window` dispatched it to be forwarded
            // so we're making sure that the origin is not tampered (i.e script is not masquerading it's true identity)
            context: 'window',
            tabId: null,
          },
        }),
      );
    }

  });

  port.onMessage(endpointRuntime.handleMessage);

  port.onFailure((message) => {
    if (message.origin.context === 'window') {
      win.postMessage({
        transactionID: message.transactionId,
        type: 'error',
      });

      return;
    }

    endpointRuntime.endTransaction(message.transactionId);
  });

  if (allowWindowMessagingForNamespace) {
    win.setNamespace(allowWindowMessagingForNamespace);
    win.enable();
    windowMessagingNamespace = allowWindowMessagingForNamespace;
  }

  setMessagingAPI({
    emitEvent: eventChannel.emitEvent,
    onEvent: eventChannel.onEvent,
    onMessage: endpointRuntime.onMessage,
    sendMessage: endpointRuntime.sendMessage,
  });
}
