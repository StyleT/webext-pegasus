import type {ISelfIDService} from './background/getSelfIDService';
import type {ITestEventBus} from '@/ITestEventBus';

import {getRPCService} from '@webext-pegasus/rpc';
import {
  definePegasusEventBus,
  definePegasusMessageBus,
} from '@webext-pegasus/transport';
import {initPegasusTransport} from '@webext-pegasus/transport/window';

import {ITestMessageBus} from '@/ITestMessageBus';
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

    const messageBus = definePegasusMessageBus<ITestMessageBus>();
    messageBus.onMessage('test-message', (data) => {
      // eslint-disable-next-line no-console
      console.log('Received test-message at injected script', data);
    });
    getRPCService<ISelfIDService>('getSelfID', 'background')().then(({tabId}) =>
      messageBus.sendMessage(
        'test-message',
        'Hello world from injected script!',
        {
          context: 'content-script',
          tabId,
        },
      ),
    );

    renderStoreCounterUI('window-script');
  },
});
