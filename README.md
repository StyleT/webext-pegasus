![Logo](./assets/logo.png)

# webext-pegasus

![License](https://badgen.net/github/license/StyleT/webext-pegasus)
![@webext-pegasus/transport version](https://badgen.net/npm/v/@webext-pegasus%2Ftransport?label=@webext-pegasus%2Ftransport)
![@webext-pegasus/rpc version](https://badgen.net/npm/v/@webext-pegasus%2Frpc?label=@webext-pegasus%2Frpc)
![@webext-pegasus/store version](https://badgen.net/npm/v/@webext-pegasus%2Fstore?label=@webext-pegasus%2Fstore)
![@webext-pegasus/store-zustand version](https://badgen.net/npm/v/@webext-pegasus%2Fstore-zustand?label=@webext-pegasus%2Fstore-zustand)

Communication framework for browser extensions, with wings!

## What's included?

- `@webext-pegasus/rpc` - Strongly typed RPC (messaging) API that allows `M:1` communication between extension surfaces
- `@webext-pegasus/store-zustand` - [Zustand](https://github.com/pmndrs/zustand) adapter to share state between pages (content script, injected script, popup, devtools, etc..) and background in web extensions. Based on `@webext-pegasus/store`.
- `@webext-pegasus/store` - APIs for building Redux/Zustand/Mobx/etc applications in Web Extensions.
- `@webext-pegasus/transport` - Low level transport layer that allows to use same APIs within all runtime contexts (especially important for reusable components) while mitigating issues like this one [zikaari/crx-bridge#11](https://github.com/zikaari/crx-bridge/issues/11)

## Supports

* **Runtime contexts:** window (injected script), popup, devtools, content script, background, options, sidepanel (_planned_)
* **Browsers:** Chrome, Firefox, Safari, Opera, Edge + others supported by [webextension-polyfill](https://github.com/mozilla/webextension-polyfill)
