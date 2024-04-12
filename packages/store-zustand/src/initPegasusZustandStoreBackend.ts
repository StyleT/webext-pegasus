import type {StoreApi} from 'zustand';

import {initPegasusStoreBackend} from '@webext-pegasus/store';

import getConfiguration from './getConfiguration';
import {ZustandAction} from './types';

export function initPegasusZustandStoreBackend<S>(
  storeName: string,
  store: StoreApi<S>,
): void {
  initPegasusStoreBackend<S, ZustandAction<S>>(
    {
      async dispatch(action) {
        if (action.type !== '__ZUSTAND_SYNC__') {
          console.warn('Unexpected action type:', action.type);
          return action;
        }
        store.setState(action.state);

        return action;
      },

      getState: store.getState,

      subscribe: store.subscribe,
    },
    {
      ...getConfiguration(),
      portName: storeName,
    },
  );
}
