import {PegasusRPCMessage} from '@webext-pegasus/rpc';

export type ITabIDService = typeof getTabIDService;

export async function getTabIDService(
  message: PegasusRPCMessage,
): Promise<number> {
  let tabID: number | undefined = message.sender.tabId;
  if (message.sender.context === 'popup') {
    tabID = (await browser.tabs.query({active: true, currentWindow: true}))[0]
      .id;
  }
  if (tabID === undefined) {
    throw new Error(`Could not get tab ID for message: ${message.toString()}`);
  }
  return tabID;
}
