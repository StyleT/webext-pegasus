import type {InternalMessage} from './types-internal';
import type {DeliveryReceipt} from './utils/delivery-logger';
import type {EndpointFingerprint} from './utils/endpoint-fingerprint';
import type {Runtime} from 'webextension-polyfill';

export type StatusMessage =
  | {
      status: 'undeliverable';
      message: InternalMessage;
      resolvedDestination: string;
    }
  | {
      status: 'deliverable';
      deliverableTo: string;
    }
  | {
      status: 'delivered';
      receipt: DeliveryReceipt;
    }
  | {
      status: 'incoming';
      message: InternalMessage;
    }
  | {
      status: 'terminated';
      fingerprint: EndpointFingerprint;
    };

export type RequestMessage =
  | {
      type: 'sync';
      pendingResponses: ReadonlyArray<DeliveryReceipt>;
      pendingDeliveries: ReadonlyArray<string>;
    }
  | {
      type: 'deliver';
      message: InternalMessage;
    };

export class PortMessage {
  static toBackground(port: Runtime.Port, message: RequestMessage) {
    return port.postMessage(message);
  }

  static toExtensionContext(port: Runtime.Port, message: StatusMessage) {
    return port.postMessage(message);
  }
}
