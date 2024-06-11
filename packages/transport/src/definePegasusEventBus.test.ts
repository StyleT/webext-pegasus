/* eslint-disable @typescript-eslint/no-unused-vars */
import {JsonValue} from 'type-fest';

import {definePegasusEventBus} from './definePegasusEventBus';
import {PegasusMessage} from './types';
import {TransportBroadcastEventAPI} from './types-internal';

interface ProtocolMap {
  message1: void;
  message2: string;
  message3: {t: number};
}

// If no generic param is provided, resolves to unique symbol "MissingProtocolMap"
const a: symbol = definePegasusEventBus();

const eventBus = definePegasusEventBus<ProtocolMap>();
const messaging2: TransportBroadcastEventAPI<ProtocolMap> =
  definePegasusEventBus<ProtocolMap>();

// @ts-expect-error - Argument of type '"invalid"' is not assignable to parameter of type 'keyof ProtocolMap'
eventBus.emitBroadcastEvent('invalid', undefined);
// @ts-expect-error - You can't omit data parameter
eventBus.emitBroadcastEvent('message1');
// @ts-expect-error - You can't omit data parameter
eventBus.emitBroadcastEvent('message2');
const b: Promise<void> = eventBus.emitBroadcastEvent('message1', undefined);
// @ts-expect-error - Argument of type 'string' is not assignable to parameter of type 'void'.
eventBus.emitBroadcastEvent('message1', 'undefined');
const c: Promise<void> = eventBus.emitBroadcastEvent('message2', 'some string');
// @ts-expect-error - Argument of type 'false' is not assignable to parameter of type 'string'
const d: Promise<void> = eventBus.emitBroadcastEvent('message2', false);
const e: Promise<void> = eventBus.emitBroadcastEvent('message3', {t: 1});

// @ts-expect-error - Argument of type '"invalid"' is not assignable to parameter of type 'keyof ProtocolMap'.ts(2345)
eventBus.onBroadcastEvent('invalid', () => {});
eventBus.onBroadcastEvent('message1', (message) => {
  const aa: void = message.data;
});
eventBus.onBroadcastEvent('message2', async (message) => {
  const aa: string = message.data;
  const m: PegasusMessage<string> = message;
});
eventBus.onBroadcastEvent('message3', (message) => {
  const aa: {t: number} = message.data;
});
