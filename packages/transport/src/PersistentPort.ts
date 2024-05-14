import type {StatusMessage} from './PortMessage';
import type {InternalPacket} from './types-internal';
import type {Runtime} from 'webextension-polyfill';

import browser from 'webextension-polyfill';

import {PortMessage} from './PortMessage';
import {encodeConnectionArgs} from './utils/connection-args';
import {createDeliveryLogger} from './utils/delivery-logger';
import {createFingerprint} from './utils/endpoint-fingerprint';

interface QueuedMessage {
  resolvedDestination: string;
  message: InternalPacket;
}

/**
 * Manfiest V3 extensions can have their service worker terminated at any point
 * by the browser. That termination of service worker also terminates any messaging
 * porta created by other parts of the extension. This class is a wrapper around the
 * built-in Port object that re-instantiates the port connection everytime it gets
 * suspended
 *
 * Used by extension contexts to communicate with the background script (service worker)
 */
export const createPersistentPort = (name = '') => {
  const fingerprint = createFingerprint();
  let port: Runtime.Port;
  let undeliveredQueue: ReadonlyArray<QueuedMessage> = [];
  const pendingResponses = createDeliveryLogger();
  const onMessageListeners = new Set<
    (message: InternalPacket, p: Runtime.Port) => void
  >();
  const onFailureListeners = new Set<(message: InternalPacket) => void>();

  const handleMessage = (msg: StatusMessage, msgPort: Runtime.Port) => {
    switch (msg.status) {
      case 'undeliverable':
        if (!undeliveredQueue.some((m) => m.message.id === msg.message.id)) {
          undeliveredQueue = [
            ...undeliveredQueue,
            {
              message: msg.message,
              resolvedDestination: msg.resolvedDestination,
            },
          ];
        }

        return;

      case 'deliverable':
        undeliveredQueue = undeliveredQueue.reduce((acc, queuedMsg) => {
          if (queuedMsg.resolvedDestination === msg.deliverableTo) {
            PortMessage.toBackground(msgPort, {
              message: queuedMsg.message,
              type: 'deliver',
            });

            return acc;
          }

          return [...acc, queuedMsg];
        }, [] as ReadonlyArray<QueuedMessage>);

        return;

      case 'delivered':
        if (msg.receipt.message.messageType === 'message') {
          pendingResponses.add(msg.receipt);
        }

        return;

      case 'incoming':
        if (msg.message.messageType === 'reply') {
          pendingResponses.remove(msg.message.id);
        }

        onMessageListeners.forEach((cb) => cb(msg.message, msgPort));

        return;

      case 'terminated': {
        const rogueMsgs = pendingResponses
          .entries()
          .filter((receipt) => msg.fingerprint === receipt.to);
        pendingResponses.remove(rogueMsgs);
        rogueMsgs.forEach(({message}) =>
          onFailureListeners.forEach((cb) => cb(message)),
        );
      }
    }
  };

  const connect = () => {
    port = browser.runtime.connect({
      name: encodeConnectionArgs({
        endpointName: name,
        fingerprint,
      }),
    });
    port.onMessage.addListener(handleMessage);
    port.onDisconnect.addListener(connect);

    PortMessage.toBackground(port, {
      pendingDeliveries: [
        ...new Set(
          undeliveredQueue.map(({resolvedDestination}) => resolvedDestination),
        ),
      ],
      pendingResponses: pendingResponses.entries(),
      type: 'sync',
    });
  };

  connect();

  return {
    onFailure(cb: (message: InternalPacket) => void) {
      onFailureListeners.add(cb);
    },
    onMessage(cb: (message: InternalPacket) => void): void {
      onMessageListeners.add(cb);
    },
    postMessage(message: InternalPacket): void {
      PortMessage.toBackground(port, {
        message,
        type: 'deliver',
      });
    },
  };
};
