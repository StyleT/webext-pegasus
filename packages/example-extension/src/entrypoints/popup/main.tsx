import './style.css';

import {initPegasusTransport} from '@webext-pegasus/transport/popup';
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.tsx';

initPegasusTransport();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
