![webext-pegasus Logo](https://github.com/StyleT/webext-pegasus/blob/main/assets/logo.png?raw=true)

# @webext-pegasus/transport

![License](https://badgen.net/github/license/StyleT/webext-pegasus)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/StyleT/webext-pegasus/ci.yml?branch=main)
[![Package version](https://badgen.net/npm/v/@webext-pegasus%2Ftransport)](https://www.npmjs.com/package/@webext-pegasus/transport)

**Sending messages and events in web extensions has never been easier. Batteries included 🔋🔋🔋**

Turns surface specific browser APIs into unified transport layer. So you can seamlessly communicate between all extension contexts (including injected script/window). Promotes code reusability by enabling reuse of the components that rely on messages/events between dfferent extension contexts.

No more `chrome.runtime.sendMessage` or `chrome.runtime.onConnect` or `window.dispatchEvent`

This library provides two communication patterns:

- **One-on-one messaging with optional replies** – via `sendMessage` and `onMessage` APIs. Resilient way of communication between any 2 contexts. Ex: DevTools panel and injected script within instected tab.
- **Event broadcasting** – via `emitBroadcastEvent` and `onBroadcastEvent`. This allows you to inform other extension contexts about certains events. Ex: broadcast changes to all open tabs

## Supports

* **Runtime contexts:** window (injected script), popup, devtools, content script, background, options, sidepanel (_planned_)
* **Browsers:** Chrome, Firefox, Safari, Opera, Edge + others supported by [webextension-polyfill](https://github.com/mozilla/webextension-polyfill)


## 🚀 Quick Start

```bash
npm install -S @webext-pegasus/transport
```

Initialize Pegasus transport layer **once for every runtime context** you use in your extension.

```typescript
// background.ts
import { initPegasusTransport } from '@webext-pegasus/transport/background';

initPegasusTransport();
// You can use all other Pegasus packages after it
```

As soon as Pegasus Transport was initialized - all other code that relies on transport layer may simply do the following:

```typescript
import {getTransportAPI} from '@webext-pegasus/transport';

// This will work in any runtime context as initPegasusTransport() set needed adapter within module's lexical scope
const {
  sendMessage,
  onMessage,
  emitBroadcastEvent,
  onBroadcastEvent
} = getTransportAPI();
sendMessage(/* ... */);
```

## Available entrypoints:
 - `@webext-pegasus/transport/background`
 - `@webext-pegasus/transport/content-script`
 - `@webext-pegasus/transport/devtools`
 - `@webext-pegasus/transport/options`
 - `@webext-pegasus/transport/popup`
 - `@webext-pegasus/transport/window` (for injected scripts)

 ## Comparison to other libraries

 | | `@webext-pegasus/transport` | `webext-bridge` |
 | - | - | - |
 | One-on-one messaging | ✅ | ✅ |
 | Event Broadcasting | ✅ | ❌ |
 | Context agnostic APIs | ✅ | ❌ |
 | Type Safety | ✅ | 🌦️ |

## Troubleshooting

- **Doesn't work?**

  If `window` contexts are not part of the puzzle, it shall out of the box for messaging between `devtools` <-> `background` <-> `content-script`(s). If even that is not working, it's likely that `@webext-pegasus/transport` hasn't been initialized in `background` page of your extension, which is used as a relay for all events/messages. If you don't need a background page for yourself, here's bare minimum to get Pegasus flying.

```javascript
// background.js (requires transpilation/bundling using webpack(recommended))

import { initPegasusTransport } from '@webext-pegasus/transport/background';
initPegasusTransport();
```

```javascript
// manifest.json

{
  "background": {
    "scripts": ["path/to/transpiled/background.js"]
  }
}
```


- **Can't send messages to / receive from `window`?**

  Sending or receiving messages from or to `window` requires you to open the messaging gateway in content script(s) for that particular tab. Call `initPegasusTransport({allowWindowMessagingForNamespace: '...'})` while passing `allowWindowMessagingForNamespace` option in any of your content script(s) in that tab and call `initPegasusTransport({namespace: '...'})` in the
  script loaded in top frame i.e the `window` context. Make sure that `namespaceA === namespaceB`. If you're doing this, read the [security note below](#security)


<a name="security"></a>

## Security risks while communicating with injected script

The following note only applies if and only if, you will be sending/receiving messages to/from `window` contexts. There's no security concern if you will be only working with `content-script`, `background`, `popup`, `options`, or `devtools` scope, which is the default setting.

`window` context(s) in tab `A` get unlocked the moment you call `initPegasusTransport({allowWindowMessagingForNamespace: 'TEST'})` in your extension's content script AND `initPegasusTransport({namespace: 'TEST'})` in your injected script.

Unlike `chrome.runtime.sendMessage` and `chrome.runtime.connect`, which requires extension's manifest to specify sites allowed to talk with the extension, this package has no such measure by design, which means any webpage whether you intended or not, can do `sendMessage(msgId, data, 'background')` or something similar that produces same effect, as long as it uses same protocol used by this library and namespace set to same as yours.

So to be safe, if you will be interacting with `window` contexts, treat incoming data as you would treat user input.

As an example if you plan on having something critical, **always** verify the `sender` before responding:

```javascript
// background.js

import { onMessage } from '@webext-pegasus/transport/background';

onMessage("getUserBrowsingHistory", (message) => {
  const { data, sender } = message;
  // Respond only if request is from 'devtools', 'content-script', 'popup', 'options', or 'background' endpoint
});
```

## Credits

This library is based on the [Server Side Up's](https://github.com/serversideup) implementation of the [webext-bridge](https://github.com/serversideup/webext-bridge) in context of RPC stack. However it simplifies use of the `sendMessage`/`onMessage` APIs in conponents that may be present within different runtime contexts.
