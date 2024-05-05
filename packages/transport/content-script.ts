import type {InternalBroadcastEvent, InternalMessage} from './src/types-internal';

import browser from 'webextension-polyfill';

import { createBroadcastEventRuntime } from './src/BroadcastEventRuntime';
import {createMessageRuntime} from './src/MessageRuntime';
import {createPersistentPort} from './src/PersistentPort';
import {usePostMessaging} from './src/post-message';
import {initTransportAPI} from './src/TransportAPI';

type Props = {
  allowWindowMessagingForNamespace?: string;
};

export function initPegasusTransport({
  allowWindowMessagingForNamespace,
}: Props = {}): void {
  const win = usePostMessaging('content-script');
  const port = createPersistentPort();
  const messageRuntime = createMessageRuntime('content-script', async (message) => {
    if (message.destination.context === 'window') {
      await win.postMessage(message);
    } else {
      port.postMessage(message);
    }
  });
  const eventRuntime = createBroadcastEventRuntime('content-script', async (event) => {
    browser.runtime.sendMessage(event);
  }, async (event) => win.postMessage(event));
  browser.runtime.onMessage.addListener((message: InternalBroadcastEvent) => {
    if (message.messageType === 'broadcastEvent') {
      eventRuntime.handleEvent(message);
    }
  });

  win.onMessage((message) => {
    if ('type' in message && 'transactionID' in message) {
      // msg is instance of EndpointWontRespondError
      messageRuntime.endTransaction(message.transactionID);
    } else {
      const payload = Object.assign({}, message, {
        origin: {
          // a message event inside `content-script` means a script inside `window` dispatched it to be forwarded
          // so we're making sure that the origin is not tampered (i.e script is not masquerading it's true identity)
          context: 'window',
          tabId: null,
        },
      });

      if (payload.messageType === 'broadcastEvent') {
        eventRuntime.handleEvent(payload as InternalBroadcastEvent);
      } else {
        messageRuntime.handleMessage(payload as InternalMessage);
      }
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

  // const eventChannel = withExtensionEvents((message) => {
  //   if (allowWindowMessagingForNamespace === null) {
  //     return;
  //   }

  //   const windowEvent = new CustomEvent(
  //     `pegasusEvents/${allowWindowMessagingForNamespace}/${message.eventID}`,
  //     {
  //       detail: JSON.stringify(message),
  //     },
  //   );
  //   window.dispatchEvent(windowEvent);
  // });

  initTransportAPI({
    emitBroadcastEvent: eventRuntime.emitBroadcastEvent,
    onBroadcastEvent: eventRuntime.onBroadcastEvent,
    onMessage: messageRuntime.onMessage,
    sendMessage: messageRuntime.sendMessage,
  });
}
