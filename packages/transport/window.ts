import type {JsonValue} from 'type-fest';

import {createEndpointRuntime} from './src/endpoint-runtime';
import {setMessagingAPI} from './src/getMessagingAPI';
import {usePostMessaging} from './src/post-message';

type Props = {
  namespace?: string;
};

export function initPegasusTransport({namespace}: Props = {}): void {
  const win = usePostMessaging('window');

  const endpointRuntime = createEndpointRuntime('window', (message) =>
    win.postMessage(message),
  );

  win.onMessage((msg) => {
    if ('type' in msg && 'transactionID' in msg) {
      endpointRuntime.endTransaction(msg.transactionID);
    } else {
      endpointRuntime.handleMessage(msg);
    }
  });

  if (namespace) {
    win.setNamespace(namespace);
    win.enable();
  }
  setMessagingAPI({
    emitEvent: () => {
      throw new Error('Not implemented');
    },
    onEvent: initEvents(namespace),
    onMessage: endpointRuntime.onMessage,
    sendMessage: endpointRuntime.sendMessage,
  });
}

function initEvents(namespace: string | undefined) {
  return function onEvent<Message extends JsonValue = JsonValue>(
    eventID: string,
    callback: (message: Message) => void,
  ): () => void {
    const handleEvent = (event: CustomEvent) => {
      callback(JSON.parse(event.detail));
    };
    window.addEventListener(
      `pegasusEvents/${namespace}/${eventID}`,
      handleEvent as EventListener,
    );

    return () => {
      window.removeEventListener(
        `pegasusEvents/${namespace}/${eventID}`,
        handleEvent as EventListener,
      );
    };
  };
}
