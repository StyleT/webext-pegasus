import {
  initPegasusZustandStoreBackend,
  pegasusZustandStoreReady,
} from '@webext-pegasus/store-zustand';
import {create} from 'zustand';
import {subscribeWithSelector} from 'zustand/middleware';

export interface ExtensionState {
  simpleCounterForTab: {
    [tabID: number]: number;
  };
  bumpCounterForTab: (tabID: number) => void;
  resetCounterForTab: (tabID: number) => void;
}

export const useExtensionStore = create<ExtensionState>()(
  subscribeWithSelector((set) => ({
    bumpCounterForTab: (tabID: number) =>
      set((state) => ({
        simpleCounterForTab: {
          ...state.simpleCounterForTab,
          [tabID]: (state.simpleCounterForTab[tabID] ?? 0) + 1,
        },
      })),
    resetCounterForTab: (tabID: number) =>
      set((state) => ({
        simpleCounterForTab: {
          ...state.simpleCounterForTab,
          [tabID]: 0,
        },
      })),
    simpleCounterForTab: {},
  })),
);

const STORE_NAME = 'ExtensionStore';

export const initExtensionStoreBackend = () =>
  initPegasusZustandStoreBackend(STORE_NAME, useExtensionStore);
export const extensionStoreReady = () =>
  pegasusZustandStoreReady(STORE_NAME, useExtensionStore);
