import type {JsonValue} from 'type-fest';

import {onMessage, sendMessage} from 'webext-bridge/background';
import browser from 'webextension-polyfill';

import {EventData, setMessagingAPI} from './src/getMessagingAPI';

export function initPegasusTransport(): void {
  setMessagingAPI({
    emitEvent: async <Message extends JsonValue>(
      eventID: string,
      message: Message,
    ): Promise<void> => {
      const messageData: EventData<Message> = {
        data: message,
        eventID,
        messageType: 'PegasusEvent',
      };

      try {
        await browser.runtime.sendMessage(messageData);
        const tabs = await browser.tabs.query({});
        for (const tab of tabs) {
          if (tab.id) {
            await browser.tabs.sendMessage(tab.id, messageData);
          }
        }
      } catch (e) {
        // do nothing - errors can be present
        // if no content script exists on receiver
        console.warn('Suppressed error:', e);
      }
    },
    onEvent: () => {
      throw new Error('Not implemented yet');
    },
    onMessage,
    sendMessage,
  });
}
