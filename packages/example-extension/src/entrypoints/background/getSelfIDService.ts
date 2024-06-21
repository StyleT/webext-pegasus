import {PegasusRPCMessage} from '@webext-pegasus/rpc';

export type ISelfIDService = typeof getSelfIDService;

export async function getSelfIDService(message: PegasusRPCMessage): Promise<{
  tabId: number;
  frameId?: number;
}> {
  let tabId: number | undefined = message.sender.tabId;
  if (message.sender.context === 'popup') {
    tabId = (await browser.tabs.query({active: true, currentWindow: true}))[0]
      .id;
  }
  if (tabId === undefined) {
    throw new Error(`Could not get tab ID for message: ${message.toString()}`);
  }
  return {frameId: message.sender.frameId, tabId};
}
