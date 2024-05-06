import type {ITestEventBus} from '@/ITestEventBus';

import {definePegasusEventBus} from '@webext-pegasus/transport';
import {initPegasusTransport} from '@webext-pegasus/transport/window';

export default defineUnlistedScript({
  main() {
    initPegasusTransport({namespace: 'pegasus-example'});

    const eventBus = definePegasusEventBus<ITestEventBus>();
    eventBus.onBroadcastEvent('test-event', (data) => {
      // eslint-disable-next-line no-console
      console.log('received test-event at injected script', data);
    });
    eventBus.emitBroadcastEvent(
      'test-event',
      'Hello world from injected script!',
    );
  },
});
