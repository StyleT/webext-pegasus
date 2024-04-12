import type {Destination,IPegasusRPCService, PegasusRPCService} from './types';

import {getMessagingAPI} from '@webext-pegasus/transport';

import {createProxy} from './utils/createProxy';
import {getMessageKey} from './utils/getMessageKey';

type Service = {[key: string]: unknown};

const RegisteredServices = new Set<string>();

export function getRPCService<
  TService extends IPegasusRPCService<unknown> & object & Check,
  Check = TService extends IPegasusRPCService<TService> ? unknown : never,
>(serviceName: string, destination: Destination): PegasusRPCService<TService> {
  return createProxy(getMessageKey(serviceName), destination);
}

export function registerRPCService<
  TService extends IPegasusRPCService<unknown> & object & Check,
  Check = TService extends IPegasusRPCService<TService> ? unknown : never,
>(serviceName: string, service: TService): void {
  if (RegisteredServices.has(serviceName)) {
    throw new Error(`Service ${serviceName} already registered`);
  }

  const messageKey = getMessageKey(serviceName);
  const pegasusService: Service = service;

  const {onMessage} = getMessagingAPI();

  onMessage(messageKey, ({data, ...message}) => {
    if (
      typeof data !== 'object' ||
      data == null ||
      !('path' in data) ||
      !('args' in data) ||
      !Array.isArray(data.args)
    ) {
      throw new Error(
        `Invalid message received for pegasus-rpc-service "${serviceName}": ${JSON.stringify(
          data,
          undefined,
          2,
        )}`,
      );
    }

    const path: string | null =
      data.path == null || typeof data.path !== 'string' ? null : data.path;
    const serviceCb = path == null ? pegasusService : pegasusService[path];
    if (typeof serviceCb !== 'function') {
      throw new Error(
        `Invalid message received for pegasus-rpc-service "${serviceName}": ${
          path != null
            ? `Can't find method "${path}`
            : 'Expected service to be a function'
        }"`,
      );
    }

    return Promise.resolve(serviceCb.bind(service)(message, ...data.args));
  });

  RegisteredServices.add(serviceName);
}
