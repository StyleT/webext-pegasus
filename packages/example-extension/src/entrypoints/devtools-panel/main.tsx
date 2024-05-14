import {initPegasusTransport} from '@webext-pegasus/transport/devtools';
import React from 'react';
import ReactDOM from 'react-dom/client';

import {renderStoreCounterUI} from '@/renderStoreCounterUI.ts';

import App from './App.tsx';

const tabID = browser.devtools.inspectedWindow.tabId;
initPegasusTransport();

// eslint-disable-next-line no-console
console.log(`@webext/pegasus content script: loaded for tab "${tabID}"`);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App tabID={tabID} />
  </React.StrictMode>,
);

const logPanel = document.createElement('textarea');
logPanel.style.width = '100%';
logPanel.style.height = '200px';
document.body?.appendChild(logPanel);

renderStoreCounterUI('devtools-panel', {
  onValueChange: (value) => {
    logPanel.value = logPanel.value + '\n' + value;
  },
});
