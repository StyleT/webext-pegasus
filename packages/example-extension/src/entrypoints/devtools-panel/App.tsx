import {getRPCService} from '@webext-pegasus/rpc';
import {useState} from 'react';

import {ITestHelloService} from '../../getTestHelloService';

interface Props {
  tabID: number;
}

function App({tabID}: Props) {
  const [message, setMessage] = useState('Click me!');

  const handleClick = () => {
    getRPCService<ITestHelloService>(
      'getTestHello',
      'background',
    )('Devtools Panel').then((greeting) => setMessage(greeting));
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
