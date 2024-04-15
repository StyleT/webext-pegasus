import {registerRPCService} from '@webext-pegasus/rpc';
import {getMessagingAPI} from '@webext-pegasus/transport';

import {MessageType} from './constants';
import {StoreCommunicationBridge} from './StoreCommunicationBridge';
import shallowDiff from './strategies/shallowDiff/diff';
import {
  DeserializerFn,
  DiffStrategyFn,
  IPegasusStore,
  PegasusStoreAction,
  PegasusStoreAnyAction,
  SerializerFn,
  StateDiff,
} from './types';

export type PegasusStoreBackendProps<
  S,
  A extends PegasusStoreAction = PegasusStoreAnyAction,
> = {
  portName: string;
  serializer: SerializerFn<S | StateDiff<S> | A>;
  deserializer: DeserializerFn<A>;
  diffStrategy?: DiffStrategyFn<S>;
};

/**
 * Wraps a Redux store so that proxy stores can connect to it.
 */
export function initPegasusStoreBackend<
  S,
  A extends PegasusStoreAction = PegasusStoreAnyAction,
>(
  store: IPegasusStore<S, A>,
  {
    portName,
    serializer,
    deserializer,
    diffStrategy = shallowDiff,
  }: PegasusStoreBackendProps<S, A>,
) {
  const {emitEvent} = getMessagingAPI();

  registerRPCService(
    `PegasusStoreCommunicationBridgeFor-${portName}`,
    new StoreCommunicationBridge(store, serializer, deserializer),
  );

  let currentState = store.getState();

  // Send patched state down connected port on every redux store state change
  store.subscribe(() => {
    const newState = store.getState();
    const diff = diffStrategy(currentState, newState);

    if (diff.length) {
      currentState = newState;

      // Notifying what extension is broadcasting the state changes
      emitEvent(
        `pegasusStore/${portName}/${MessageType.PATCH_STATE}`,
        serializer(diff),
      ).catch((error) => {
        console.error('Error emitting patch state event:', error);
      });
    }
  });

  // Send store's initial state through port
  emitEvent(
    `pegasusStore/${portName}/${MessageType.STATE}`,
    serializer(currentState),
  ).catch((error) => {
    console.error('Error emitting initial state event:', error);
  });

  // /**
  //  * Setup external action handler
  //  */
  // if (browserAPI.runtime.onMessageExternal) {
  //   withPayloadDeserializer((...args) =>
  //     browserAPI.runtime.onMessageExternal.addListener(...args),
  //   )(dispatchResponse, shouldDeserialize);
  // } else {
  //   console.warn(
  //     'runtime.onMessageExternal is not supported. See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessageExternal',
  //   );
  // }
}
