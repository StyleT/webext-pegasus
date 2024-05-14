/* eslint-disable no-console */

// Create the panel which appears within the browser devtools
browser.devtools.panels.create(
  '@webext-pegasus',
  '/wxt.svg',
  'devtools-panel.html',
);

console.log('DevTools page: loaded.');
