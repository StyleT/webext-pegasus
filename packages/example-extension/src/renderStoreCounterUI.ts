import type {ISelfIDService} from './entrypoints/background/getSelfIDService';

import {getRPCService} from '@webext-pegasus/rpc';

import {extensionStoreReady} from './store';

interface Props {
  onValueChange?: (value: number) => void;
}

export function renderStoreCounterUI(contextName: string, props: Props = {}) {
  extensionStoreReady()
    .then(async (store) => {
      // eslint-disable-next-line no-console
      console.log(`@webext/pegasus ${contextName}: store ready.`);

      const {tabId: tabID} = await getRPCService<ISelfIDService>(
        'getSelfID',
        'background',
      )();

      // eslint-disable-next-line no-console
      console.log(`@webext/pegasus ${contextName}: received tab ID: ${tabID}`);

      let counter = store.getState().simpleCounterForTab[tabID] ?? 0;
      // eslint-disable-next-line no-console
      console.log(
        `@webext/pegasus ${contextName}: counter current value: ${counter}`,
      );
      props.onValueChange?.(counter);

      const counterCTA = document.createElement('button');
      document.body?.appendChild(counterCTA);
      const updateCounterCTA = () =>
        (counterCTA.innerText = `Increment counter (${contextName}): ${counter}`);
      updateCounterCTA();

      store.subscribe((state) => {
        const newCounter = state.simpleCounterForTab[tabID] ?? 0;
        if (newCounter !== counter) {
          counter = store.getState().simpleCounterForTab[tabID] ?? 0;
          // eslint-disable-next-line no-console
          console.log(
            `@webext/pegasus ${contextName}: counter NEW value: ${counter}`,
            state,
          );
          props.onValueChange?.(counter);
          updateCounterCTA();
        }
      });

      counterCTA.onclick = () => {
        store.getState().bumpCounterForTab(tabID);
      };
    })
    .catch((err) =>
      console.error(
        `@webext/pegasus ${contextName}: Failed to init store`,
        err,
      ),
    );
}
