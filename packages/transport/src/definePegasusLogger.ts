import { consoleLogger } from './logger/consoleLogger';
import {getTransportAPI} from './TransportAPI';
import { Logger } from './types';

export function definePegasusLogger(): Logger {
  const {logger} = getTransportAPI();

  if (logger == null) {
    return consoleLogger('info', {module: 'webext-pegasus'});
  }

  return logger;
}
