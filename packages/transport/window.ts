import type {JsonValue} from 'type-fest';

import {onMessage, sendMessage, setNamespace} from 'webext-bridge/window';

import {setMessagingAPI} from './src/getMessagingAPI';

type Props = {
  namespace?: string;
};

export function initPegasusTransport({namespace}: Props = {}): void {
  if (namespace) {
    setNamespace(namespace);
  }
  setMessagingAPI({
    emitEvent: () => {
      throw new Error('Not implemented');
    },
    onEvent: initEvents(namespace),
    onMessage,
    sendMessage,
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
