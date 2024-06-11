import type {PegasusMessage, RuntimeContext} from './types';
import type {JsonValue} from 'type-fest';

import {serializeError} from 'serialize-error';
import uuid from 'tiny-uid';

import {
  InternalBroadcastEvent,
  TransportBroadcastEventAPI,
} from './types-internal';

export interface BroadcastEventRuntime extends TransportBroadcastEventAPI {
  /**
   * @internal
   */
  handleEvent: (message: InternalBroadcastEvent) => void;
}

export const createBroadcastEventRuntime = (
  thisContext: RuntimeContext,
  routeEvent: (event: InternalBroadcastEvent) => Promise<void>,
  localEvent?: (event: InternalBroadcastEvent) => Promise<void>,
): BroadcastEventRuntime => {
  const runtimeId = uuid();
  const onEventListeners = new Map<
    string,
    Array<(event: PegasusMessage<JsonValue>) => void | Promise<void>>
  >();

  const handleEvent = async (event: InternalBroadcastEvent): Promise<void> => {
    const relayedViaBackground =
      event.hops.findIndex((hop) => hop.startsWith(`background::`)) !== -1;
    // If event was sent from background or it's already a relay from background
    // All broadcast events are relayed through background
    if (
      (thisContext === 'background' && event.origin.context === thisContext) ||
      relayedViaBackground
    ) {
      localEvent?.(event);

      const {id: eventID} = event;

      const errs: unknown[] = [];

      const callbacks = onEventListeners.get(eventID) ?? [];

      for (const cb of callbacks) {
        try {
          await cb({
            data: event.data,
            id: eventID,
            sender: event.origin,
            timestamp: event.timestamp,
          } as PegasusMessage<JsonValue>);
        } catch (error) {
          errs.push(error);
        }
      }

      if (errs.length > 0) {
        throw new Error(
          `Error(s) occurred while handling broadcast event ${eventID}: ${errs
            .map((err) => serializeError(err))
            .join(', ')}`,
        );
      }

      // If event was sent from background and not relayed,
      // we still need to route it to other contexts
      if (relayedViaBackground) {
        return;
      }
    }

    event.hops.push(`${thisContext}::${runtimeId}`);

    return routeEvent(event);
  };

  return {
    emitBroadcastEvent: async <Data extends JsonValue>(
      eventID: string,
      data: Data,
    ): Promise<void> => {
      const payload: InternalBroadcastEvent = {
        data,
        hops: [],
        id: eventID,
        messageType: 'broadcastEvent',
        origin: {
          context: thisContext,
          tabId: null,
        },
        timestamp: Date.now(),
        transactionId: uuid(),
      };

      return await handleEvent(payload);
    },
    handleEvent: handleEvent,
    onBroadcastEvent: (eventID, callback) => {
      const currentListeners = onEventListeners.get(eventID) ?? [];
      onEventListeners.set(eventID, [
        ...currentListeners,
        callback as (event: PegasusMessage<JsonValue>) => void,
      ]);

      return () => {
        const oldListeners = onEventListeners.get(eventID) ?? [];

        onEventListeners.set(
          eventID,
          oldListeners.filter((listener) => listener !== callback),
        );
      };
    },
  };
};
