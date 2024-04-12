import type {StoreApi} from 'zustand';

import {PegasusStore} from '@webext-pegasus/store';

import getConfiguration from './getConfiguration';
import {ZustandAction} from './types';

export async function pegasusZustandStoreReady<S>(
  storeName: string,
  store: StoreApi<S>,
): Promise<void> {
  const configuration = getConfiguration();

  const proxyStore = new PegasusStore<S, ZustandAction<S>>({
    ...configuration,
    portName: storeName,
    state: store.getState(),
  });
  // wait to be ready
  await proxyStore.ready();
  // initial state
  store.setState(proxyStore.getState());

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
}
