import type {
  DataTypeKey,
  Destination,
  GetDataType,
  GetReturnType,
  InternalMessage,
  OnMessageCallback,
  PegasusMessage,
  RuntimeContext,
} from './types';
import type {JsonValue} from 'type-fest';

import {serializeError} from 'serialize-error';
import uuid from 'tiny-uid';

import {deserializeEndpoint} from './utils/endpoint-utils';

export interface MessageRuntime {
  sendMessage: <
    ReturnType extends JsonValue,
    K extends DataTypeKey = DataTypeKey,
  >(
    messageID: K,
    data: GetDataType<K, JsonValue>,
    destination?: Destination,
  ) => Promise<GetReturnType<K, ReturnType>>;
  onMessage: <
    Data extends JsonValue = JsonValue,
    K extends DataTypeKey = DataTypeKey,
  >(
    messageID: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: OnMessageCallback<GetDataType<K, Data>, GetReturnType<K, any>>,
  ) => () => void;
  /**
   * @internal
   */
  handleMessage: (message: InternalMessage) => void;
  endTransaction: (transactionID: string) => void;
}

export const createMessageRuntime = (
  thisContext: RuntimeContext,
  routeMessage: (msg: InternalMessage) => void,
  localMessage?: (msg: InternalMessage) => void,
): MessageRuntime => {
  const runtimeId = uuid();
  const openTransactions = new Map<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {resolve: (v: any) => void; reject: (e: any) => void}
  >();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onMessageListeners = new Map<string, OnMessageCallback<any>>();

  const handleMessage = (message: InternalMessage) => {
    if (
      message.destination.context === thisContext &&
      !message.destination.frameId &&
      !message.destination.tabId
    ) {
      localMessage?.(message);

      const {transactionId, messageID, messageType} = message;

      const handleReply = () => {
        const transactionP = openTransactions.get(transactionId);
        if (transactionP) {
          const {err, data} = message;
          if (err) {
            const dehydratedErr = err as Record<string, string>;
            // eslint-disable-next-line no-restricted-globals, @typescript-eslint/no-explicit-any
            const errCtr = (self as {[key: string]: any})[dehydratedErr.name];
            const hydratedErr = new (
              typeof errCtr === 'function' ? errCtr : Error
            )(dehydratedErr.message);

            // eslint-disable-next-line no-restricted-syntax
            for (const prop in dehydratedErr) {
              hydratedErr[prop] = dehydratedErr[prop];
            }

            transactionP.reject(hydratedErr);
          } else {
            transactionP.resolve(data);
          }
          openTransactions.delete(transactionId);
        }
      };

      const handleNewMessage = async () => {
        let reply: JsonValue | void = null;
        let err: Error | null = null;
        let noHandlerFoundError = false;

        try {
          const cb = onMessageListeners.get(messageID);
          if (typeof cb === 'function') {
            reply = await cb({
              data: message.data,
              id: messageID,
              sender: message.origin,
              timestamp: message.timestamp,
            } as PegasusMessage<JsonValue>);
          } else {
            noHandlerFoundError = true;
            throw new Error(
              `[pegasus-transport] No handler registered in '${thisContext}' to accept messages with id '${messageID}'`,
            );
          }
        } catch (error) {
          err = error as Error;
        } finally {
          if (err) {
            message.err = serializeError(err);
          }

          handleMessage({
            ...message,
            data: reply,
            destination: message.origin,
            hops: [],
            messageType: 'reply',
            origin: {context: thisContext, tabId: null},
          });

          if (err && !noHandlerFoundError) {
            // eslint-disable-next-line no-unsafe-finally
            throw reply;
          }
        }
      };

      switch (messageType) {
        case 'reply':
          return handleReply();
        case 'message':
          return handleNewMessage();
      }
    }

    message.hops.push(`${thisContext}::${runtimeId}`);

    return routeMessage(message);
  };

  return {
    endTransaction: (transactionID) => {
      const transactionP = openTransactions.get(transactionID);
      transactionP?.reject('Transaction was ended before it could complete');
      openTransactions.delete(transactionID);
    },
    handleMessage,
    onMessage: (messageID, callback) => {
      onMessageListeners.set(messageID, callback);

      return () => onMessageListeners.delete(messageID);
    },
    sendMessage: (messageID, data, destination = 'background') => {
      const endpoint =
        typeof destination === 'string'
          ? deserializeEndpoint(destination)
          : destination;
      const errFn = 'Bridge#sendMessage ->';

      if (!endpoint.context) {
        throw new TypeError(
          `${errFn} Destination must be any one of known destinations`,
        );
      }

      return new Promise((resolve, reject) => {
        const payload: InternalMessage = {
          data,
          destination: endpoint,
          hops: [],
          messageID,
          messageType: 'message',
          origin: {context: thisContext, tabId: null},
          timestamp: Date.now(),
          transactionId: uuid(),
        };

        openTransactions.set(payload.transactionId, {reject, resolve});

        try {
          handleMessage(payload);
        } catch (error) {
          openTransactions.delete(payload.transactionId);
          reject(error);
        }
      });
    },
  };
};
