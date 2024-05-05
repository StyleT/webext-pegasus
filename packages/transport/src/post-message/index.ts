import type {EndpointWontRespondError, InternalPacket} from '../types-internal';

import {getMessagePort} from './message-port';

/**
 * Used for communication between content-script and window contexts.
 * It leverages Channel Messaging API to establish two-way communication channel
 */
export const usePostMessaging = (thisContext: 'window' | 'content-script') => {
  let allocatedNamespace: string;
  let messagingEnabled = false;
  let onMessageCallback: (
    msg: InternalPacket | EndpointWontRespondError,
  ) => void;
  let portP: Promise<MessagePort>;

  return {
    enable: () => (messagingEnabled = true),
    onMessage: (cb: typeof onMessageCallback) => (onMessageCallback = cb),
    postMessage: async (msg: InternalPacket | EndpointWontRespondError) => {
      if (thisContext !== 'content-script' && thisContext !== 'window') {
        throw new Error('Endpoint does not use postMessage');
      }

      if (!messagingEnabled) {
        throw new Error('Communication with window has not been allowed');
      }

      ensureNamespaceSet(allocatedNamespace);

      return (await portP).postMessage(msg);
    },
    setNamespace: (nsps: string) => {
      if (allocatedNamespace) {
        throw new Error('Namespace once set cannot be changed');
      }

      allocatedNamespace = nsps;
      portP = getMessagePort(thisContext, nsps, ({data}) =>
        onMessageCallback?.(data),
      );
    },
  };
};

function ensureNamespaceSet(namespace: string) {
  if (typeof namespace !== 'string' || namespace.trim().length === 0) {
    throw new Error(
      'pegasus-transport uses window.postMessage to talk with other "window"(s) for message routing' +
        'which is global/conflicting operation in case there are other scripts using pegasus-transport. ' +
        'Call initPegasusTransport({namespace}) (in window) or initPegasusTransport({allowWindowMessagingForNamespace}) (in content-script) to isolate your app. ' +
        "Example: setNamespace('com.facebook.react-devtools'). " +
        'Make sure to use same namespace across all your scripts whereever window.postMessage is likely to be used`',
    );
  }
}
