import './App.css';

import {getRPCService} from '@webext-pegasus/rpc';
import {useState} from 'react';

import {ITestHelloService} from '../../getTestHelloService';

function App() {
  const [message, setMessage] = useState('Click me!');

  const handleClick = () => {
    getRPCService<ITestHelloService>(
      'getTestHello',
      'background',
    )('Popup').then((greeting) => setMessage(greeting));
  };

  return (
    <>
      <div className="card">
        <button onClick={handleClick}>{message}</button>
      </div>
    </>
  );
}

export default App;
