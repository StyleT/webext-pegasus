import type {Destination, PegasusRPCService} from '../types';

import {getTransportAPI} from '@webext-pegasus/transport';

/**
 * Create and returns a "deep" proxy. Every property that is accessed returns another proxy, and
 * when a function is called at any depth (0 to infinity), a message is sent to the background.
 */
export function createProxy<TService>(
  messageKey: string,
  destination: Destination,
  path?: string,
): PegasusRPCService<TService> {
  const wrapped = (() => {}) as PegasusRPCService<TService>;

  const proxy = new Proxy(wrapped, {
    // Executed when the object is called as a function
    apply(_target, _thisArg, args) {
      const {sendMessage} = getTransportAPI();

      return sendMessage(
        messageKey,
        {
          args,
          path: path ?? null,
        },
        destination,
      );
    },

    // Executed when accessing a property on an object
    get(target, propertyName, receiver) {
      if (propertyName === '__proxy' || typeof propertyName === 'symbol') {
        return Reflect.get(target, propertyName, receiver);
      }

      return createProxy(
        messageKey,
        destination,
        path == null ? propertyName : `${path}.${propertyName}`,
      );
    },
  });

  // @ts-expect-error: Adding a hidden property
  proxy.__proxy = true;

  return proxy;
}
