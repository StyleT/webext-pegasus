import type {InternalPacket} from '../types-internal';
import type {EndpointFingerprint} from './endpoint-fingerprint';

export interface DeliveryReceipt {
  message: InternalPacket;
  to: EndpointFingerprint;
  from: {
    endpointId: string;
    fingerprint: EndpointFingerprint;
  };
}

export const createDeliveryLogger = () => {
  let logs: ReadonlyArray<DeliveryReceipt> = [];

  return {
    add: (...receipts: DeliveryReceipt[]) => {
      logs = [...logs, ...receipts];
    },
    entries: () => logs,
    remove: (message: string | DeliveryReceipt[]) => {
      logs =
        typeof message === 'string'
          ? logs.filter((receipt) => receipt.message.transactionId !== message)
          : logs.filter((receipt) => !message.includes(receipt));
    },
  };
};
