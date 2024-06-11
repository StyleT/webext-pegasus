import {IPegasusRPCService, PegasusRPCMessage} from '@webext-pegasus/rpc';

import {
  DeserializerFn,
  IPegasusStore,
  PegasusStoreAction,
  PegasusStoreAnyAction,
  SerializerFn,
} from './types';

export type IStoreCommunicationBridge<
  S,
  A extends PegasusStoreAction = PegasusStoreAnyAction,
> = InstanceType<typeof StoreCommunicationBridge<S, A>>;

export class StoreCommunicationBridge<
  S,
  A extends PegasusStoreAction = PegasusStoreAnyAction,
> implements IPegasusRPCService<StoreCommunicationBridge<S, A>>
{
  constructor(
    private readonly store: IPegasusStore<S, A>,
    private readonly serializer: SerializerFn<S | A>,
    private readonly deserializer: DeserializerFn<S | A>,
  ) {}

  fetchState(_message: PegasusRPCMessage): string {
    const state = this.store.getState();
    const serializedState = this.serializer(state);

    return serializedState as string;
  }

  async dispatch(
    _message: PegasusRPCMessage,
    serializedMessage: string,
  ): Promise<string> {
    return this.serializer(
      await this.store.dispatch(this.deserializer(serializedMessage) as A),
    );
  }
}
