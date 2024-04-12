/* eslint-disable @typescript-eslint/no-unused-vars */

import {getRPCService, registerRPCService} from './RPCServices';
import {PegasusRPCMessage} from './types';

// @ts-expect-error
registerRPCService('testbedService', false);
// @ts-expect-error
registerRPCService('testbedService', null);
// @ts-expect-error
registerRPCService('testbedService', undefined);
// @ts-expect-error
registerRPCService('testbedService', '');

class TestService {
  method1(
    _sender: PegasusRPCMessage,
    tst: string,
    tst2: number,
    tst4: boolean,
  ): number {
    return 1;
  }
  method2(
    _sender: PegasusRPCMessage,
    _tst: {a: number[]; b: string[]; c: {d: string}},
  ): string {
    return '';
  }
  async method3(): Promise<number> {
    return 1;
  }
  method4() {}
  // Expecting unknown shall be allowed
  method5(
    _sender: PegasusRPCMessage,
    a: unknown,
    b: {c: unknown; d: {e: unknown}},
  ): void {}
}
registerRPCService('testbedService', new TestService());
// @ts-expect-error
registerRPCService('testbedService', TestService);

class TestService2 {
  method1(_sender: string): number {
    return 1;
  }
}
// @ts-expect-error
registerRPCService('testbedService', new TestService2());

class TestService3 {
  method1(_sender: PegasusRPCMessage): Date | null | undefined {
    return null;
  }
  method2(_sender: PegasusRPCMessage): Date {
    return new Date();
  }
}
// @ts-expect-error
registerRPCService('testbedService', new TestService3());

const service1 = getRPCService<InstanceType<typeof TestService>>(
  'tst',
  'background',
);
const sr1: Promise<number> = service1.method1('', 1, true);
const sr2: Promise<string> = service1.method2({
  a: [1, 2, 3],
  b: ['a', 'b', 'c'],
  c: {d: 'e'},
});
const sr3: Promise<number> = service1.method3();
const sr4: Promise<void> = service1.method4();

class TestService4 {
  method1(a: string, b: Date): number {
    return 1;
  }
}
// @ts-expect-error when forbidden parameter isn't first while head is invalid too
registerRPCService('testbedService', new TestService4());

class TestService5 {
  method1(a: string, b: string): number {
    return 1;
  }
}
// @ts-expect-error when first parameter is invalid in presence of tail
registerRPCService('testbedService', new TestService5());

function rpcService1(): void {}
registerRPCService('testbedService', rpcService1);

// First parameter must accept sender information
function rpcService2(a: Date): void {}
// @ts-expect-error
registerRPCService('testbedService', rpcService2);

function rpcService3(_sender: PegasusRPCMessage): number {
  return 1;
}
registerRPCService('testbedService', rpcService3);
const fn3: () => Promise<number> = getRPCService<typeof rpcService3>(
  'tst',
  'background',
);

async function rpcService4(
  _sender: PegasusRPCMessage,
  _tst: {a: number[]; b: string[]; c: {d: string}},
): Promise<number> {
  return 1;
}
registerRPCService('testbedService', rpcService4);
const fn4: (_tst: {
  a: number[];
  b: string[];
  c: {d: string};
}) => Promise<number> = getRPCService<typeof rpcService4>('tst', 'background');

// Non serializable return type is not allowed
function rpcService5(): Date {
  return new Date();
}
// @ts-expect-error
registerRPCService('testbedService', rpcService5);
