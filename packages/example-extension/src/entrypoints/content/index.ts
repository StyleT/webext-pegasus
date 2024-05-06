import type {ITestEventBus} from '@/ITestEventBus';

import {definePegasusEventBus} from '@webext-pegasus/transport';
import {initPegasusTransport} from '@webext-pegasus/transport/content-script';

import injectScript from './injectScript';

export default defineContentScript({
  main() {
    initPegasusTransport({allowWindowMessagingForNamespace: 'pegasus-example'});
    // eslint-disable-next-line no-console
    console.log('Hello content.');

    injectScript('/injected.js');

    const eventBus = definePegasusEventBus<ITestEventBus>();
    eventBus.onBroadcastEvent('test-event', (data) => {
      // eslint-disable-next-line no-console
      console.log('received test-event at content script', data);
    });
    eventBus.emitBroadcastEvent(
      'test-event',
      'Hello world from content script!',
    );
  },
  matches: ['<all_urls>'],
  registration: 'manifest',
  runAt: 'document_end',
});
