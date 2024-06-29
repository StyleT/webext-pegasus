import {createBroadcastEventRuntime} from './src/BroadcastEventRuntime';
import {createMessageRuntime} from './src/MessageRuntime';
import {usePostMessaging} from './src/post-message';
import {initTransportAPI} from './src/TransportAPI';
import { Logger } from './src/types';
import {
  isInternalBroadcastEvent,
  isInternalMessage,
} from './src/utils/internalPacketTypeGuards';

type Props = {
  namespace?: string;
  /**
   * Logger instance to use for logging, if none is provided, default logger that logs to console will be used.
   */
  logger?: Logger;
};

export function initPegasusTransport({namespace, logger}: Props = {}): void {
  const win = usePostMessaging('window');

  const messageRuntime = createMessageRuntime('window', (message) =>
    win.postMessage(message),
  );
  const eventRuntime = createBroadcastEventRuntime('window', (event) =>
    win.postMessage(event),
  );

  win.onMessage((msg) => {
    if ('type' in msg && 'transactionID' in msg) {
      // msg is instance of EndpointWontRespondError
      messageRuntime.endTransaction(msg.transactionID);
    } else if (isInternalBroadcastEvent(msg)) {
      eventRuntime.handleEvent(msg);
    } else if (isInternalMessage(msg)) {
      messageRuntime.handleMessage(msg);
    } else {
      throw new TypeError('Unknown message type');
    }
  });

  if (namespace) {
    win.setNamespace(namespace);
    win.enable();
  }
  initTransportAPI({
    browser: null,
    emitBroadcastEvent: eventRuntime.emitBroadcastEvent,
    logger,
    onBroadcastEvent: eventRuntime.onBroadcastEvent,
    onMessage: messageRuntime.onMessage,
    sendMessage: messageRuntime.sendMessage,
  });
}
