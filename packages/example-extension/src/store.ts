/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

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
