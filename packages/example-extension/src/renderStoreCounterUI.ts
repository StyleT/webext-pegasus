import type {ITabIDService} from './entrypoints/background/getTabIDService';

import {getRPCService} from '@webext-pegasus/rpc';

import {extensionStoreReady} from './store';

export function renderStoreCounterUI(contextName: string) {
  extensionStoreReady()
    .then(async (store) => {
      // eslint-disable-next-line no-console
      console.log(`@webext/pegasus ${contextName}: store ready.`);

      const tabID = await getRPCService<ITabIDService>(
        'getTabID',
        'background',
      )();

      // eslint-disable-next-line no-console
      console.log(`@webext/pegasus ${contextName}: received tab ID: ${tabID}`);

      let counter = store.getState().simpleCounterForTab[tabID];
      // eslint-disable-next-line no-console
      console.log(
        `@webext/pegasus ${contextName}: counter current value: ${counter}`,
      );

      store.subscribe((state) => {
        const newCounter = state.simpleCounterForTab[tabID];
        if (newCounter !== counter) {
          counter = store.getState().simpleCounterForTab[tabID];
          // eslint-disable-next-line no-console
          console.log(
            `@webext/pegasus ${contextName}: counter NEW value: ${counter}`,
            state,
          );
        }
      });

      const counterCTA = document.createElement('button');
      counterCTA.innerText = `Increment counter33 (${contextName})`;
      counterCTA.onclick = () => {
        store.getState().bumpCounterForTab(tabID);
      };
      document.body?.appendChild(counterCTA);
    })
    .catch((err) =>
      console.error(
        `@webext/pegasus ${contextName}: Failed to init store`,
        err,
      ),
    );
}
