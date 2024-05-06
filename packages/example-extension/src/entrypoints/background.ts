import type {ITestEventBus} from '@/ITestEventBus';

import {registerRPCService} from '@webext-pegasus/rpc';
import {definePegasusEventBus} from '@webext-pegasus/transport';
import {initPegasusTransport} from '@webext-pegasus/transport/background';

import {getTestHelloService} from '../getTestHelloService';

export default defineBackground(() => {
  // eslint-disable-next-line no-console
  console.log('Hello background!', {id: browser.runtime.id});

  initPegasusTransport();

  // debugger;
  registerRPCService('getTestHello', getTestHelloService);

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
});
