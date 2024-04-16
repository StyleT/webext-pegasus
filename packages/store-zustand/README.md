![webext-pegasus Logo](https://github.com/StyleT/webext-pegasus/blob/main/assets/logo.png?raw=true)

# @webext-pegasus/store-zustand

![License](https://badgen.net/github/license/StyleT/webext-pegasus)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/StyleT/webext-pegasus/ci.yml?branch=main)
![Package version](https://badgen.net/npm/v/@webext-pegasus%2Fstore-zustand)

Zustand adapter to share state between pages (content script, injected script, popup, devtools, etc..) and background in web extensions.

## Supports

* **Runtime contexts:** window (injected script), popup, devtools, content script, background, options, sidepanel (_planned_)
* **Browsers:** Chrome, Firefox, Safari, Opera, Edge + others supported by [webextension-polyfill](https://github.com/mozilla/webextension-polyfill)

## 🚀 Quick Start

```bash
npm install -S @webext-pegasus/transport @webext-pegasus/store-zustand
```

- Create a store based on https://github.com/pmndrs/zustand.
- You can create a store either reactive way or vanilla.
- Wrap the store with `wrapStore`. Import the store from the background.
- You should await for the store to connect to the background.

That's it! Now your store is available from everywhere.

`store.ts`

```js
import { create } from 'zustand'
// or import { createStore } from 'zustand/vanilla'
import { wrapStore } from 'webext-zustand'

interface BearState {
  bears: number
  increase: (by: number) => void
}

export const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}))

export const STORE_NAME = 'GlobalBearStore';

export function bearStoreReady = () => pegasusZustandStoreReady(STORE_NAME, useBearStore);
```

`background.ts`

```js
import { initPegasusTransport } from '@webext-pegasus/transport/background';
import { initPegasusZustandStoreBackend } from '@webext-pegasus/store-zustand';

import {useBearStore as store, STORE_NAME} from './store';

initPegasusTransport();
initPegasusZustandStoreBackend(STORE_NAME, store);

// listen state changes
store.subscribe((state) => {
  // console.log(state);
});

// dispatch
// store.getState().increase(2);
```

`popup.tsx`

```js
import React from 'react';
import { createRoot } from 'react-dom/client';
import {initPegasusTransport} from '@webext-pegasus/transport/popup';

import { useBearStore, bearStoreReady } from './store';

const Popup = () => {
  const bears = useBearStore((state) => state.bears);
  const increase = useBearStore((state) => state.increase);

  return (
    <div>
      Popup
      <div>
        <span>Bears: {bears}</span>
        <br />
        <button onClick={() => increase(1)}>Increment +</button>
      </div>
    </div>
  );
};

// Init surface specific APIs
initPegasusTransport();

bearStoreReady().then(() => {
  createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
});
```

`content-script.tsx`

```js
import React from 'react';
import { createRoot } from 'react-dom/client';
import {initPegasusTransport} from '@webext-pegasus/transport/content-script';

import { useBearStore, bearStoreReady } from './store';

const Content = () => {
  const bears = useBearStore((state) => state.bears);
  const increase = useBearStore((state) => state.increase);

  return (
    <div>
      Content
      <div>
        <span>Bears: {bears}</span>
        <br />
        <button onClick={() => increase(1)}>Increment +</button>
      </div>
    </div>
  );
};

// Init surface specific APIs
initPegasusTransport();

bearStoreReady().then(() => {
  const root = document.createElement("div");
  document.body.prepend(root);

  createRoot(root).render(
    <React.StrictMode>
      <Content />
    </React.StrictMode>
  );
});
```

## Credits

This library is based on the [Sinan Bekar's](https://github.com/sinanbekar) implementation of the [webext-zustand](https://github.com/sinanbekar/webext-zustand).
However it adds support of the injected scripts & utilizes newer, simplified transport layer.
