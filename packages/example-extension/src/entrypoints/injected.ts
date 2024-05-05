import {getTransportAPI} from '@webext-pegasus/transport';
import {initPegasusTransport} from '@webext-pegasus/transport/window';

export default defineUnlistedScript({
  main() {
    initPegasusTransport({namespace: 'pegasus-example'});

    const transportAPI = getTransportAPI();
    transportAPI.onBroadcastEvent<string>('test-event', (data) => {
      // eslint-disable-next-line no-console
      console.log('received test-event at injected script', data);
    });
    transportAPI.emitBroadcastEvent<string>(
      'test-event',
      'Hello world from injected script!',
    );
  },
});
