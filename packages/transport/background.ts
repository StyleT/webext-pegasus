import type {RequestMessage} from './src/PortMessage';
import type {InternalPacket} from './src/types-internal';
import type {DeliveryReceipt} from './src/utils/delivery-logger';
import type {EndpointFingerprint} from './src/utils/endpoint-fingerprint';
import type {Runtime} from 'webextension-polyfill';

import browser from 'webextension-polyfill';

import {createBroadcastEventRuntime} from './src/BroadcastEventRuntime';
import {createMessageRuntime} from './src/MessageRuntime';
import {PortMessage} from './src/PortMessage';
import {initTransportAPI} from './src/TransportAPI';
import {InternalBroadcastEvent} from './src/types-internal';
import {decodeConnectionArgs} from './src/utils/connection-args';
import {createDeliveryLogger} from './src/utils/delivery-logger';
import {createFingerprint} from './src/utils/endpoint-fingerprint';
import {
  deserializeEndpoint,
  serializeEndpoint,
} from './src/utils/endpoint-utils';
import {internalPacketTypeRouter} from './src/utils/internalPacketTypeRouter';

interface PortConnection {
  port: Runtime.Port;
  fingerprint: EndpointFingerprint;
}

export function initPegasusTransport(): void {
  const pendingResponses = createDeliveryLogger();
  const connMap = new Map<string, PortConnection>();
  const oncePortConnectedCbs = new Map<string, Set<() => void>>();
  const onceSessionEndCbs = new Map<EndpointFingerprint, Set<() => void>>();

  const oncePortConnected = (endpointName: string, cb: () => void) => {
    oncePortConnectedCbs.set(
      endpointName,
      (oncePortConnectedCbs.get(endpointName) || new Set()).add(cb),
    );

    return () => {
      const su = oncePortConnectedCbs.get(endpointName);
      if (su?.delete(cb) && su?.size === 0) {
        oncePortConnectedCbs.delete(endpointName);
      }
    };
  };

  const onceSessionEnded = (
    sessionFingerprint: EndpointFingerprint,
    cb: () => void,
  ) => {
    onceSessionEndCbs.set(
      sessionFingerprint,
      (onceSessionEndCbs.get(sessionFingerprint) || new Set()).add(cb),
    );
  };

  const notifyEndpoint = (endpoint: string) => ({
    withFingerprint: (fingerprint: EndpointFingerprint) => {
      const nextChain = <T>(v: T) => ({and: () => v});

      const notifications = {
        aboutIncomingMessage: (message: InternalPacket) => {
          const recipient = connMap.get(endpoint);
          if (recipient == null) {
            throw new Error('Unable to find recipient endpoint');
          }

          PortMessage.toExtensionContext(recipient.port, {
            message,
            status: 'incoming',
          });

          return nextChain(notifications);
        },

        aboutMessageUndeliverability: (
          resolvedDestination: string,
          message: InternalPacket,
        ) => {
          const sender = connMap.get(endpoint);
          if (sender?.fingerprint === fingerprint) {
            PortMessage.toExtensionContext(sender.port, {
              message,
              resolvedDestination,
              status: 'undeliverable',
            });
          }

          return nextChain(notifications);
        },

        aboutSessionEnded: (endedSessionFingerprint: EndpointFingerprint) => {
          const conn = connMap.get(endpoint);
          if (conn?.fingerprint === fingerprint) {
            PortMessage.toExtensionContext(conn.port, {
              fingerprint: endedSessionFingerprint,
              status: 'terminated',
            });
          }

          return nextChain(notifications);
        },

        aboutSuccessfulDelivery: (receipt: DeliveryReceipt) => {
          const sender = connMap.get(endpoint);
          if (sender == null) {
            throw new Error('Unable to find sender endpoint');
          }

          PortMessage.toExtensionContext(sender.port, {
            receipt,
            status: 'delivered',
          });

          return nextChain(notifications);
        },

        whenDeliverableTo: (targetEndpoint: string) => {
          const notifyDeliverability = () => {
            const origin = connMap.get(endpoint);
            if (
              origin?.fingerprint === fingerprint &&
              connMap.has(targetEndpoint)
            ) {
              PortMessage.toExtensionContext(origin.port, {
                deliverableTo: targetEndpoint,
                status: 'deliverable',
              });

              return true;
            }
          };

          if (!notifyDeliverability()) {
            const unsub = oncePortConnected(
              targetEndpoint,
              notifyDeliverability,
            );
            onceSessionEnded(fingerprint, unsub);
          }

          return nextChain(notifications);
        },
      };

      return notifications;
    },
  });

  const sessFingerprint = createFingerprint();

  const messageRuntime = createMessageRuntime(
    'background',
    async (message) => {
      if (
        message.origin.context === 'background' &&
        ['content-script', 'devtools'].includes(message.destination.context) &&
        !message.destination.tabId
      ) {
        throw new TypeError(
          'When sending messages from background page, use @tabId syntax to target specific tab',
        );
      }

      const resolvedSender = serializeEndpoint({
        ...message.origin,
        ...(message.origin.context === 'window' && {context: 'content-script'}),
      });

      const resolvedDestination = serializeEndpoint({
        ...message.destination,
        ...(message.destination.context === 'window' && {
          context: 'content-script',
        }),
        tabId: message.destination.tabId || message.origin.tabId,
      });

      // downstream endpoints are agnostic of these attributes, presence of these attrs will make them think the message is not intended for them
      message.destination.tabId = null;
      message.destination.frameId = undefined;

      // TODO: fix "as" type casting below
      const dest = () => connMap.get(resolvedDestination) as PortConnection;
      const sender = () => connMap.get(resolvedSender) as PortConnection;

      const deliver = () => {
        notifyEndpoint(resolvedDestination)
          .withFingerprint(dest().fingerprint)
          .aboutIncomingMessage(message);

        const receipt: DeliveryReceipt = {
          from: {
            endpointId: resolvedSender,
            fingerprint: sender()?.fingerprint,
          },
          message,
          to: dest().fingerprint,
        };

        if (message.messageType === 'message') {
          pendingResponses.add(receipt);
        }

        if (message.messageType === 'reply') {
          pendingResponses.remove(message.id);
        }

        if (sender()) {
          notifyEndpoint(resolvedSender)
            .withFingerprint(sender().fingerprint)
            .aboutSuccessfulDelivery(receipt);
        }
      };

      if (dest()?.port) {
        deliver();
      } else if (message.messageType === 'message') {
        if (message.origin.context === 'background') {
          oncePortConnected(resolvedDestination, deliver);
        } else if (sender()) {
          notifyEndpoint(resolvedSender)
            .withFingerprint(sender().fingerprint)
            .aboutMessageUndeliverability(resolvedDestination, message)
            .and()
            .whenDeliverableTo(resolvedDestination);
        }
      }
    },
    async (message) => {
      const resolvedSender = serializeEndpoint({
        ...message.origin,
        ...(message.origin.context === 'window' && {context: 'content-script'}),
      });

      const sender = connMap.get(resolvedSender);
      if (sender == null) {
        throw new Error('Unable to find sender endpoint');
      }

      const receipt: DeliveryReceipt = {
        from: {
          endpointId: resolvedSender,
          fingerprint: sender.fingerprint,
        },
        message,
        to: sessFingerprint,
      };

      notifyEndpoint(resolvedSender)
        .withFingerprint(sender.fingerprint)
        .aboutSuccessfulDelivery(receipt);
    },
  );

  browser.runtime.onConnect.addListener((incomingPort) => {
    const connArgs = decodeConnectionArgs(incomingPort.name);

    if (!connArgs) {
      return;
    }

    // all other contexts except 'content-script' are aware of, and pass their identity as name
    connArgs.endpointName ||= serializeEndpoint({
      context: 'content-script',
      frameId: incomingPort.sender?.frameId,
      tabId: incomingPort.sender?.tab?.id ?? null,
    });

    // literal tab id in case of content script, however tab id of inspected page in case of devtools context
    const {tabId: linkedTabId, frameId: linkedFrameId} = deserializeEndpoint(
      connArgs.endpointName,
    );

    connMap.set(connArgs.endpointName, {
      fingerprint: connArgs.fingerprint,
      port: incomingPort,
    });

    oncePortConnectedCbs.get(connArgs.endpointName)?.forEach((cb) => cb());
    oncePortConnectedCbs.delete(connArgs.endpointName);

    onceSessionEnded(connArgs.fingerprint, () => {
      const rogueMsgs = pendingResponses
        .entries()
        .filter((pendingMessage) => pendingMessage.to === connArgs.fingerprint);
      pendingResponses.remove(rogueMsgs);

      rogueMsgs.forEach((rogueMessage) => {
        if (rogueMessage.from.endpointId === 'background') {
          messageRuntime.endTransaction(rogueMessage.message.transactionId);
        } else {
          notifyEndpoint(rogueMessage.from.endpointId)
            .withFingerprint(rogueMessage.from.fingerprint)
            .aboutSessionEnded(connArgs.fingerprint);
        }
      });
    });

    incomingPort.onDisconnect.addListener(() => {
      // sometimes previous content script's onDisconnect is called *after* the fresh content-script's
      // onConnect. So without this fingerprint equality check, we would remove the new port from map
      if (
        connMap.get(connArgs.endpointName)?.fingerprint === connArgs.fingerprint
      ) {
        connMap.delete(connArgs.endpointName);
      }

      onceSessionEndCbs.get(connArgs.fingerprint)?.forEach((cb) => cb());
      onceSessionEndCbs.delete(connArgs.fingerprint);
    });

    incomingPort.onMessage.addListener((msg: RequestMessage) => {
      if (msg.type === 'sync') {
        const allActiveSessions = [...connMap.values()].map(
          (conn) => conn.fingerprint,
        );
        const stillPending = msg.pendingResponses.filter((fp) =>
          allActiveSessions.includes(fp.to),
        );

        pendingResponses.add(...stillPending);

        msg.pendingResponses
          .filter(
            (deliveryReceipt) =>
              !allActiveSessions.includes(deliveryReceipt.to),
          )
          .forEach((deliveryReceipt) =>
            notifyEndpoint(connArgs.endpointName)
              .withFingerprint(connArgs.fingerprint)
              .aboutSessionEnded(deliveryReceipt.to),
          );

        msg.pendingDeliveries.forEach((intendedDestination) =>
          notifyEndpoint(connArgs.endpointName)
            .withFingerprint(connArgs.fingerprint)
            .whenDeliverableTo(intendedDestination),
        );

        return;
      }

      if (msg.type === 'deliver' && msg.message?.origin?.context) {
        // origin tab ID is resolved from the port identifier (also prevent "MITM attacks" of extensions)
        msg.message.origin.tabId = linkedTabId;
        msg.message.origin.frameId = linkedFrameId;

        internalPacketTypeRouter(msg.message, {eventRuntime, messageRuntime});
      }
    });
  });

  let undeliveredEvents: InternalBroadcastEvent[] | undefined = [];
  // PersistentPort usually reconnects within 500ms
  setTimeout(() => {
    Promise.all(
      (undeliveredEvents as InternalBroadcastEvent[]).map(routeEvent),
    ).catch((err) => {
      console.error('Error while tying to deliver undelivered events:', err);
    });
    undeliveredEvents = undefined;
  }, 500);

  const routeEvent = async (event: InternalBroadcastEvent) => {
    // Background SW just resumed it's work and there are no connections yet
    // so we need to queue the event for later delivery
    if (connMap.size === 0 && undeliveredEvents !== undefined) {
      undeliveredEvents.push(event);
      return;
    }

    connMap.forEach((port, endpoint) => {
      notifyEndpoint(endpoint)
        .withFingerprint(port.fingerprint)
        .aboutIncomingMessage(event);
    });

    // So background listeners receive events from other contexts
    if (event.origin.context !== 'background') {
      eventRuntime.handleEvent(event);
    }
  };

  const eventRuntime = createBroadcastEventRuntime('background', routeEvent);

  initTransportAPI({
    browser: browser,
    emitBroadcastEvent: eventRuntime.emitBroadcastEvent,
    onBroadcastEvent: eventRuntime.onBroadcastEvent,
    onMessage: messageRuntime.onMessage,
    sendMessage: messageRuntime.sendMessage,
  });
}
