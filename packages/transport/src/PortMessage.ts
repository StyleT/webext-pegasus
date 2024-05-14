import type {InternalPacket} from './types-internal';
import type {DeliveryReceipt} from './utils/delivery-logger';
import type {EndpointFingerprint} from './utils/endpoint-fingerprint';
import type {Runtime} from 'webextension-polyfill';

export type StatusMessage =
  | {
      status: 'undeliverable';
      message: InternalPacket;
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
      message: InternalPacket;
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
      message: InternalPacket;
    };

export class PortMessage {
  static toBackground(port: Runtime.Port, message: RequestMessage) {
    return port.postMessage(message);
  }

  static toExtensionContext(port: Runtime.Port, message: StatusMessage) {
    return port.postMessage(message);
  }
}
