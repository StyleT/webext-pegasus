import type {ITestEventBus} from '@/ITestEventBus';

import {registerRPCService} from '@webext-pegasus/rpc';
import {definePegasusEventBus} from '@webext-pegasus/transport';
import {initPegasusTransport} from '@webext-pegasus/transport/background';

import {initExtensionStoreBackend} from '@/store';

import {getTestHelloService} from '../../getTestHelloService';
import {getTabIDService} from './getTabIDService';

export default defineBackground(() => {
  initPegasusTransport();

  // eslint-disable-next-line no-console
  console.log('@webext/pegasus background SW: loaded.', {
    id: browser.runtime.id,
  });

  // debugger;
  registerRPCService('getTestHello', getTestHelloService);

  // Way for content script & injected scripts to get their tab ID
  registerRPCService('getTabID', getTabIDService);

  const eventBus = definePegasusEventBus<ITestEventBus>();
  eventBus.onBroadcastEvent('test-event', (data) => {
    // eslint-disable-next-line no-console
    console.log('received test-event at background script', data);
  });
  eventBus.emitBroadcastEvent(
    'test-event',
    'Hello world from background script!',
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).pegasusEventBus = eventBus;

  initExtensionStoreBackend().catch((err) =>
    console.error('Error initializing extension store backend', err),
  );
});
