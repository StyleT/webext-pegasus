![webext-pegasus Logo](https://github.com/StyleT/webext-pegasus/blob/main/assets/logo.png?raw=true)

# @webext-pegasus/rpc

![License](https://badgen.net/github/license/StyleT/webext-pegasus)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/StyleT/webext-pegasus/ci.yml?branch=main)
[![Package version](https://badgen.net/npm/v/@webext-pegasus%2Frpc)](https://www.npmjs.com/package/@webext-pegasus/rpc)

RPC Messaging in Web Extensions made easy and type safe. Out of the box.
It provides a simple type-safe wrapper around the web extension messaging APIs that lets you call a function/class from anywhere, but execute it in the target runtime context.

## Supports

* **Runtime contexts:** window (injected script), popup, devtools, content script, background, options, sidepanel (_planned_)
* **Browsers:** Chrome, Firefox, Safari, Opera, Edge + others supported by [webextension-polyfill](https://github.com/mozilla/webextension-polyfill)

## 🚀 Quick Start

```bash
npm install -S @webext-pegasus/transport @webext-pegasus/rpc
```

- Create service in a form of a class or function that implements `IPegasusRPCService<YourService>`
- Export TypeScript interface for it
- Register interface via `registerRPCService('serviceName', yourService)` in the target runtime context (ex: background)
- Acquire service wrapper via `getRPCService<YourServiceType>('serviceName', 'background')`
  - _That's it! Now you can call it from any other place in your extension!_


**MathService.ts**
```typescript
import {IPegasusRPCService, PegasusRPCMessage} from '@webext-pegasus/rpc';

export type IMathService = InstanceType<
  typeof MathService
>;

export class MathService
  implements IPegasusRPCService<MathService>
{
  // Every public method shall:
  // - accept "sender: PegasusRPCMessage" as first parameter, if it accepts any params
  // - accept / return only serializable values, as RPC messages must be serialized as they move between extension contexts 
  // See "./src/types.test.ts" for more examples
  fibonacci(_sender: PegasusRPCMessage, num: number): number {
    return this.#fibonacciImpl(num);
  }

  // We keep implemenation in private method as we don't need sender information here
  #fibonacciImpl(num: number): number {
    return (num <= 1) ? 1 : this.#fibonacciImpl(num - 1) + this.#fibonacciImpl(num - 2);
  }
}
```

**background.ts**
```typescript
import {registerRPCService} from '@webext-pegasus/rpc';
import {initPegasusTransport} from '@webext-pegasus/transport/background';

import {MathService} from './MathService.ts';

// Done once in every runtime context to init transport layer
initPegasusTransport();

registerRPCService(
  'MathService',
  new MathService(),
);
```

**injected.ts**
```typescript
// Important to import type only as we don't want to cause any errors by injecting
// code that expects web extension runtime to be loaded on target webpag
import type {IMathService} from './MathService.ts';

import {getRPCService} from '@webext-pegasus/rpc';
import {initPegasusTransport} from '@webext-pegasus/transport/window';

// Done once in every runtime context to init transport layer
initPegasusTransport();

const mathService = getRPCService<IMathService>(
  // Same ID that was used for registration
  // We may have multiple instances of the same service executed independently
  'MathService',
  // Where sevice was registered
  'background',
);

// Note that now mathService.fibonacci() returns Promise
mathService.fibonacci(10).then(console.log);
// Output: 89
```

## Functional services

This library also allows you to define RPC service as a function ([as showcased in example](/packages/example-extension/src/getTestHelloService.ts)).

**getTestHelloService.ts**
```typescript
import {PegasusRPCMessage} from '@webext-pegasus/rpc';

export type ITestHelloService = typeof getTestHelloService;

export function getTestHelloService(
  _message: PegasusRPCMessage,
  name: string,
): string {
  return `Warmest hello for ${name} from the service!`;
}
```

Which can be later called (don't forget to register it first via `registerRPCService`) in the following way:

```typescript
const getTestHelloService = getRPCService<ITestHelloService>(
  'getTestHello',
  'background',
);

getTestHelloService('Mike').then(console.log);
// Will print: 
// Warmest hello for Mike from the service!
```

## PegasusRPCMessage

Message information provided as a first parameter to every public method of Pegasus RPC service serves a purpose of identifying caller identity and providing relevant response.

This is useful for example to create a `SelfIDService` that allows to retrieve it's `tabId` and `frameId` for content script, window script or popup.

**getSelfIDService.ts**

```typescript
import {PegasusRPCMessage} from '@webext-pegasus/rpc';
import browser from 'webextension-polyfill';

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

```