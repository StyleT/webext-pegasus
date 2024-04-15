![webext-pegasus Logo](https://github.com/StyleT/webext-pegasus/blob/main/assets/logo.png?raw=true)

# @webext-pegasus/rpc

![License](https://badgen.net/github/license/StyleT/webext-pegasus)
![Package version](https://badgen.net/npm/v/@webext-pegasus%2Frpc)

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
  fibonacci(num: number): number {
    return (num <= 1) ? 1 : this.fibonacci(num - 1) + this.fibonacci(num - 2);
  }
}
```

**background.ts**
```typescript
import {registerRPCService} from '@webext-pegasus/rpc';
import {MathService} from './MathService.ts';

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
