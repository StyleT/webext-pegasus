![Logo](./assets/logo.png)

# webext-pegasus

![License](https://badgen.net/github/license/StyleT/webext-pegasus)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/StyleT/webext-pegasus/ci.yml?branch=main)
[![NPM Downloads](https://img.shields.io/npm/dm/%40webext-pegasus%2Ftransport?logo=npm)](https://www.npmjs.com/org/webext-pegasus)
[![@webext-pegasus/transport version](https://badgen.net/npm/v/@webext-pegasus%2Ftransport?label=@webext-pegasus%2Ftransport)](https://www.npmjs.com/package/@webext-pegasus/transport)
[![@webext-pegasus/rpc version](https://badgen.net/npm/v/@webext-pegasus%2Frpc?label=@webext-pegasus%2Frpc)](https://www.npmjs.com/package/@webext-pegasus/rpc)
[![@webext-pegasus/store version](https://badgen.net/npm/v/@webext-pegasus%2Fstore?label=@webext-pegasus%2Fstore)](https://www.npmjs.com/package/@webext-pegasus/store)
[![@webext-pegasus/store-zustand version](https://badgen.net/npm/v/@webext-pegasus%2Fstore-zustand?label=@webext-pegasus%2Fstore-zustand)](https://www.npmjs.com/package/@webext-pegasus/store-zustand)

Communication framework for browser extensions, with wings!

## What's included?

- [`@webext-pegasus/rpc`](./packages/rpc/) - Strongly typed RPC (messaging) API that allows `M:1` communication between extension surfaces
- [`@webext-pegasus/store-zustand`](./packages/store-zustand/) - [Zustand](https://github.com/pmndrs/zustand) adapter to share state between pages (content script, injected script, popup, devtools, etc..) and background in web extensions. Based on `@webext-pegasus/store`.
- [`@webext-pegasus/store`](./packages/store/) - APIs for building Redux/Zustand/Mobx/etc applications in Web Extensions.
- [`@webext-pegasus/transport`](./packages/transport/) - Low level transport layer that allows to use same APIs within all runtime contexts (especially important for reusable components) while mitigating issues like this one [zikaari/crx-bridge#11](https://github.com/zikaari/crx-bridge/issues/11)

> [!TIP]
> Please refer to individual package `README.md` files for respective packages as well as [./packages/example-extension](./packages/example-extension) for examples.

## Supports

* **Runtime contexts:** window (injected script), popup, devtools, content script, background, options, sidepanel (_planned_)
* **Browsers:** Chrome, Firefox, Safari, Opera, Edge + others supported by [webextension-polyfill](https://github.com/mozilla/webextension-polyfill)
