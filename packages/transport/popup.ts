import {onMessage, sendMessage} from 'webext-bridge/popup';

import {setMessagingAPI} from './src/getMessagingAPI';
import {withExtensionEvents} from './src/withExtensionEvents';

const eventChannel = withExtensionEvents(() => {});

export function initPegasusTransport(): void {
  setMessagingAPI({
    emitEvent: eventChannel.emitEvent,
    onEvent: eventChannel.onEvent,
    onMessage,
    sendMessage,
  });
}
