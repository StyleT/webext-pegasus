import {type Browser} from 'webextension-polyfill';

import {getTransportAPI} from './TransportAPI';

export function definePegasusBrowserAPI(): Browser | null {
  const {browser} = getTransportAPI();

  return browser;
}
