import type {InternalMessage} from './src/types';
import type {EndpointWontRespondError} from './src/types-internal';

import {createMessageRuntime} from './src/MessageRuntime';
import {createPersistentPort} from './src/PersistentPort';
import {usePostMessaging} from './src/post-message';
import {initTransportAPI} from './src/TransportAPI';
import {withExtensionEvents} from './src/withExtensionEvents';

type Props = {
  allowWindowMessagingForNamespace?: string;
};

export function initPegasusTransport({
  allowWindowMessagingForNamespace,
}: Props = {}): void {
  const win = usePostMessaging('content-script');
  const port = createPersistentPort();
  const messageRuntime = createMessageRuntime('content-script', (message) => {
    if (message.destination.context === 'window') {
      win.postMessage(message);
    } else {
      port.postMessage(message);
    }
  });

  win.onMessage((message: InternalMessage | EndpointWontRespondError) => {
    if ('type' in message && 'transactionID' in message) {
      messageRuntime.endTransaction(message.transactionID);
    } else {
      messageRuntime.handleMessage(
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

  port.onMessage(messageRuntime.handleMessage);

  port.onFailure((message) => {
    if (message.origin.context === 'window') {
      win.postMessage({
        transactionID: message.transactionId,
        type: 'error',
      });

      return;
    }

    messageRuntime.endTransaction(message.transactionId);
  });

  if (allowWindowMessagingForNamespace) {
    win.setNamespace(allowWindowMessagingForNamespace);
    win.enable();
  }

  const eventChannel = withExtensionEvents((message) => {
    if (allowWindowMessagingForNamespace === null) {
      return;
    }

    const windowEvent = new CustomEvent(
      `pegasusEvents/${allowWindowMessagingForNamespace}/${message.eventID}`,
      {
        detail: JSON.stringify(message),
      },
    );
    window.dispatchEvent(windowEvent);
  });

  initTransportAPI({
    emitBroadcastEvent: eventChannel.emitBroadcastEvent,
    onBroadcastEvent: eventChannel.onBroadcastEvent,
    onMessage: messageRuntime.onMessage,
    sendMessage: messageRuntime.sendMessage,
  });
}
