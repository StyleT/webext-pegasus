import {createMessageRuntime} from './src/MessageRuntime';
import {createPersistentPort} from './src/PersistentPort';
import {initTransportAPI} from './src/TransportAPI';
import {withExtensionEvents} from './src/withExtensionEvents';

const eventChannel = withExtensionEvents(() => {});

export function initPegasusTransport(): void {
  const port = createPersistentPort('options');
  const messageRuntime = createMessageRuntime('options', (message) =>
    port.postMessage(message),
  );

  port.onMessage(messageRuntime.handleMessage);

  initTransportAPI({
    emitBroadcastEvent: eventChannel.emitBroadcastEvent,
    onBroadcastEvent: eventChannel.onBroadcastEvent,
    onMessage: messageRuntime.onMessage,
    sendMessage: messageRuntime.sendMessage,
  });
}
