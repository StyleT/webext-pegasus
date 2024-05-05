import type {PegasusMessage} from './src/types';
import type {InternalBroadcastEvent} from './src/types-internal';
import type {JsonValue} from 'type-fest';

import {createMessageRuntime} from './src/MessageRuntime';
import {usePostMessaging} from './src/post-message';
import {initTransportAPI} from './src/TransportAPI';

type Props = {
  namespace?: string;
};

export function initPegasusTransport({namespace}: Props = {}): void {
  const win = usePostMessaging('window');

  const messageRuntime = createMessageRuntime('window', (message) =>
    win.postMessage(message),
  );

  win.onMessage((msg) => {
    if ('type' in msg && 'transactionID' in msg) {
      messageRuntime.endTransaction(msg.transactionID);
    } else {
      messageRuntime.handleMessage(msg);
    }
  });

  if (namespace) {
    win.setNamespace(namespace);
    win.enable();
  }
  initTransportAPI({
    emitBroadcastEvent: () => {
      throw new Error('Not implemented');
    },
    onBroadcastEvent: initEvents(namespace),
    onMessage: messageRuntime.onMessage,
    sendMessage: messageRuntime.sendMessage,
  });
}

function initEvents(namespace: string | undefined) {
  return function onBroadcastEvent<Data extends JsonValue>(
    eventID: string,
    callback: (message: PegasusMessage<Data>) => void,
  ): () => void {
    const handleEvent = (event: CustomEvent) => {
      const internalEvent: InternalBroadcastEvent = JSON.parse(event.detail);
      callback({
        data: internalEvent.data as Data,
        id: internalEvent.eventID,
        sender: internalEvent.sender,
        timestamp: internalEvent.timestamp,
      });
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
