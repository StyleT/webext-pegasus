/* eslint-disable @typescript-eslint/no-unused-vars */
import {JsonValue} from 'type-fest';

import {definePegasusMessageBus} from './definePegasusMessageBus';
import {PegasusMessage, TransportMessagingAPI} from './types';

interface ProtocolMap {
  message1(): void;
  message2(data: string): Promise<void>;
  message3(): boolean;
  message4(data: {t: number}): string;
}

// If no generic param is provided, resolves to unique symbol "MissingProtocolMap"
const a: symbol = definePegasusMessageBus();

const messaging = definePegasusMessageBus<ProtocolMap>();
const messaging2: TransportMessagingAPI<ProtocolMap> =
  definePegasusMessageBus<ProtocolMap>();

// @ts-expect-error - Argument of type '"invalid"' is not assignable to parameter of type 'keyof ProtocolMap'
messaging.sendMessage('invalid', undefined);
// @ts-expect-error - You can't omit data parameter
messaging.sendMessage('message1');
// @ts-expect-error - You can't omit data parameter
messaging.sendMessage('message2');
const b: Promise<void> = messaging.sendMessage('message1', undefined);
// Return type shan't be Promise<Promise<void>>
const c: Promise<void> = messaging.sendMessage('message2', 'some string');
// @ts-expect-error - Argument of type 'false' is not assignable to parameter of type 'string'
const d: Promise<void> = messaging.sendMessage('message2', false);
const e: Promise<string> = messaging.sendMessage('message4', {t: 1});

// @ts-expect-error - Argument of type '"invalid"' is not assignable to parameter of type 'keyof ProtocolMap'.ts(2345)
messaging.onMessage('invalid', () => {});
messaging.onMessage('message1', (message) => {
  const aa: undefined = message.data;
});
messaging.onMessage('message2', async (message) => {
  const aa: string = message.data;
  const m: PegasusMessage<string> = message;
});
messaging.onMessage('message3', (message) => {
  return false;
});
// @ts-expect-error - Return type must be boolean
messaging.onMessage('message3', (message) => {});
messaging.onMessage('message4', (message) => {
  const aa: {t: number} = message.data;
  return 'some string';
});
