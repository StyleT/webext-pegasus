import {getTransportAPI} from '@webext-pegasus/transport';
import {initPegasusTransport} from '@webext-pegasus/transport/content-script';

import injectScript from './injectScript';

export default defineContentScript({
  main() {
    initPegasusTransport({allowWindowMessagingForNamespace: 'pegasus-example'});
    // eslint-disable-next-line no-console
    console.log('Hello content.');

    injectScript('/injected.js');

    const transportAPI = getTransportAPI();
    transportAPI.onBroadcastEvent<string>('test-event', (data) => {
      // eslint-disable-next-line no-console
      console.log('received test-event at content script', data);
    });
    transportAPI.emitBroadcastEvent<string>(
      'test-event',
      'Hello world from content script!',
    );
  },
  matches: ['<all_urls>'],
  registration: 'manifest',
  runAt: 'document_end',
});
