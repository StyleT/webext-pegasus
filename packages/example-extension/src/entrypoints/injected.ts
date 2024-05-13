import type {ITestEventBus} from '@/ITestEventBus';

import {definePegasusEventBus} from '@webext-pegasus/transport';
import {initPegasusTransport} from '@webext-pegasus/transport/window';

import {renderStoreCounterUI} from '@/renderStoreCounterUI';

export default defineUnlistedScript({
  main() {
    initPegasusTransport({namespace: 'pegasus-example'});

    // eslint-disable-next-line no-console
    console.log('@webext/pegasus injected script: loaded.');

    const eventBus = definePegasusEventBus<ITestEventBus>();
    eventBus.onBroadcastEvent('test-event', (data) => {
      // eslint-disable-next-line no-console
      console.log('received test-event at injected script', data);
    });
    eventBus.emitBroadcastEvent(
      'test-event',
      'Hello world from injected script!',
    );

    renderStoreCounterUI('window-script');
  },
});
