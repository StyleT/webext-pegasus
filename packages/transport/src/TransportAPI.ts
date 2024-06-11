import {TransportAPI} from './types-internal';

let API: TransportAPI | null = null;

/**
 * Used within initPegasusTransport() to init the API.
 */
export function initTransportAPI(api: TransportAPI): void {
  if (API != null) {
    throw new Error(
      'Messaging API already set. Likely you called "initPegasusTransport" twice in the same context.',
    );
  }
  API = api;
}

/**
 * Public API to retrieve transport APIs for the current context isomorphically.
 * This is useful for code that is shared between the different extension contexts.
 */
export function getTransportAPI(): TransportAPI {
  if (API == null) {
    throw new Error(
      'Messaging API wan\'t set. Make sure you called "initPegasusTransport" within current context before using @webext-pegasus packages.',
    );
  }

  return API;
}
