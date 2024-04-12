import {
  allowWindowMessaging,
  onMessage,
  sendMessage,
} from 'webext-bridge/content-script';

import {EventData, setMessagingAPI} from './src/getMessagingAPI';
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
  if (allowWindowMessagingForNamespace) {
    allowWindowMessaging(allowWindowMessagingForNamespace);
    windowMessagingNamespace = allowWindowMessagingForNamespace;
  }
  setMessagingAPI({
    emitEvent: eventChannel.emitEvent,
    onEvent: eventChannel.onEvent,
    onMessage,
    sendMessage,
  });
}
