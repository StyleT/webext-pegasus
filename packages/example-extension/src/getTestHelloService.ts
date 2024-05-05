import {PegasusRPCMessage} from '@webext-pegasus/rpc';

export type ITestHelloService = typeof getTestHelloService;

export function getTestHelloService(
  message: PegasusRPCMessage,
  name: string,
): string {
  // eslint-disable-next-line no-console
  console.log(
    'TestHelloService was called with the following parameters:',
    message,
    name,
  );

  return `Warmest hello for ${name} from the service!`;
}
