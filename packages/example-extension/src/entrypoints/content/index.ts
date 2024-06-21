import type {ISelfIDService} from '../background/getSelfIDService';
import type {ITestEventBus} from '@/ITestEventBus';
import type {ITestMessageBus} from '@/ITestMessageBus';

import {getRPCService} from '@webext-pegasus/rpc';
import {
  definePegasusEventBus,
  definePegasusMessageBus,
} from '@webext-pegasus/transport';
import {initPegasusTransport} from '@webext-pegasus/transport/content-script';

import {renderStoreCounterUI} from '@/renderStoreCounterUI';

import injectScript from './injectScript';

export default defineContentScript({
  main() {
    initPegasusTransport({allowWindowMessagingForNamespace: 'pegasus-example'});

    // eslint-disable-next-line no-console
    console.log('@webext/pegasus content script: loaded.');

    const messageBus = definePegasusMessageBus<ITestMessageBus>();
    messageBus.onMessage('test-message', (data) => {
      // eslint-disable-next-line no-console
      console.log('Received test-message at content script', data);
    });
    injectScript('/injected.js')
      .then(() => getRPCService<ISelfIDService>('getSelfID', 'background')())
      .then(({tabId}) => {
        messageBus.sendMessage(
          'test-message',
          'Hello world from content script!',
          {
            context: 'window',
            tabId,
          },
        );
      });

    const eventBus = definePegasusEventBus<ITestEventBus>();
    eventBus.onBroadcastEvent('test-event', (data) => {
      // eslint-disable-next-line no-console
      console.log('received test-event at content script', data);
    });
    eventBus.emitBroadcastEvent(
      'test-event',
      'Hello world from content script!',
    );

    renderStoreCounterUI('content-script');
  },
  matches: ['<all_urls>'],
  registration: 'manifest',
  runAt: 'document_end',
});
