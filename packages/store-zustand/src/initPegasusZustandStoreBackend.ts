import type {ZustandAction} from './types';
import type {StoreApi} from 'zustand';

import {initPegasusStoreBackend} from '@webext-pegasus/store';
import { definePegasusLogger } from 'packages/transport';

import getConfiguration from './getConfiguration';

export type PegasusZustandStoreBackendProps = {
  storageStrategy?: 'local' | 'session' | 'sync';
};

export async function initPegasusZustandStoreBackend<S>(
  storeName: string,
  store: StoreApi<S>,
  options: PegasusZustandStoreBackendProps = {},
): Promise<StoreApi<S>> {
  const logger = definePegasusLogger().child({module: 'webext-pegasus:store-zustand'});
  await initPegasusStoreBackend<S, ZustandAction<S>>(
    (preloadedState) => {
      if (preloadedState !== undefined) {
        store.setState(preloadedState);
      }

      return {
        async dispatch(action: ZustandAction<S>) {
          if (action.type !== '__ZUSTAND_SYNC__') {
            logger.warn(`Unexpected action type: ${action.type}`);
            
            return action;
          }
          store.setState(action.state);

          return action;
        },

        getState: store.getState,

        subscribe: store.subscribe,
      };
    },
    {
      ...options,
      ...getConfiguration(),
      portName: storeName,
    },
  );

  return store;
}
