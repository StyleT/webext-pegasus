import type {StoreApi} from 'zustand';

import {PegasusStore} from '@webext-pegasus/store';

import getConfiguration from './getConfiguration';
import {ZustandAction} from './types';

const storeRegistry = new WeakMap<
  StoreApi<unknown>,
  {[key: string]: Promise<void>}
>();

export async function pegasusZustandStoreReady<S>(
  storeName: string,
  store: StoreApi<S>,
): Promise<StoreApi<S>> {
  const storeRecord = storeRegistry.get(store) ?? {};
  if (storeRecord[storeName] !== undefined) {
    await storeRecord[storeName];

    return store;
  }

  const configuration = getConfiguration();

  const proxyStore = new PegasusStore<S, ZustandAction<S>>({
    ...configuration,
    portName: storeName,
    state: store.getState(),
  });

  // wait to be ready
  const storeReadinessPromise = proxyStore.ready().then(() => {
    // initial state
    store.setState(proxyStore.getState());
  });
  storeRegistry.set(store, {
    ...storeRecord,
    [storeName]: storeReadinessPromise,
  });
  await storeReadinessPromise;

  const callback = (state: S, oldState: S) => {
    proxyStore
      .dispatch({
        state,
        type: '__ZUSTAND_SYNC__',
      })
      .then((syncedState) => {
        if (!syncedState) {
          // TODO: when this can happen?
          // error (edge case)
          // prevent infinite loop
          unsubscribe();
          // revert
          store.setState(oldState);
          // resub
          unsubscribe = store.subscribe(callback);
        }
      })
      .catch((err) => {
        if (
          err instanceof Error &&
          err.message === 'Extension context invalidated.'
        ) {
          console.warn(
            'Webext-Zustand: Reloading page as we lost connection to background script...',
          );
          window.location.reload();
          return;
        }
        console.error('Error during store dispatch', err);
      });
  };

  let unsubscribe = store.subscribe(callback);

  proxyStore.subscribe(() => {
    // prevent retrigger
    unsubscribe();
    // update
    store.setState(proxyStore.getState());
    // resub
    unsubscribe = store.subscribe(callback);
  });

  return store;
}
