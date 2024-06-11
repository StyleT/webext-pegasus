import type {IStoreEventBus} from './IStoreEventBus';

import {registerRPCService} from '@webext-pegasus/rpc';
import {definePegasusEventBus} from '@webext-pegasus/transport';

import {MessageType} from './constants';
import {StoreCommunicationBridge} from './StoreCommunicationBridge';
import {StoreStorage} from './StoreStorage';
import {shallowDiff} from './strategies/shallowDiff/diff';
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
  serializer: SerializerFn<StateDiff | S | A>;
  deserializer: DeserializerFn<A | S>;
  diffStrategy?: DiffStrategyFn<S>;
  storageStrategy?: 'local' | 'session' | 'sync';
};

export type PegasusStoreInitFn<
  S,
  A extends PegasusStoreAction = PegasusStoreAnyAction,
> = (preloadedState: S | undefined) => IPegasusStore<S, A>;

/**
 * Wraps a Redux store so that proxy stores can connect to it.
 */
export async function initPegasusStoreBackend<
  S,
  A extends PegasusStoreAction = PegasusStoreAnyAction,
>(
  storeInitFn: PegasusStoreInitFn<S, A>,
  {
    portName,
    serializer,
    deserializer,
    diffStrategy = shallowDiff,
    storageStrategy,
  }: PegasusStoreBackendProps<S, A>,
): Promise<IPegasusStore<S, A>> {
  const {emitBroadcastEvent} = definePegasusEventBus<IStoreEventBus>();
  const storeStorage = new StoreStorage<S, A>(
    portName,
    storageStrategy,
    serializer,
    deserializer,
  );

  const store = storeInitFn(await storeStorage.getState());

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
      emitBroadcastEvent(
        `pegasusStore/${portName}/${MessageType.PATCH_STATE}`,
        serializer(diff),
      ).catch((error) => {
        console.error(
          `Error emitting patch state event for Pegasus Store "${portName}"`,
          error,
        );
      });

      storeStorage.setState(newState);
    }
  });

  // Send store's initial state through port
  emitBroadcastEvent(
    `pegasusStore/${portName}/${MessageType.STATE}`,
    serializer(currentState),
  ).catch((error) => {
    console.error(
      `Error emitting initial state event for Pegasus Store "${portName}"`,
      error,
    );
  });

  return store;
}
