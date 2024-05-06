import type {IStoreEventBus} from './IStoreEventBus';

import {getRPCService} from '@webext-pegasus/rpc';
import {definePegasusEventBus} from '@webext-pegasus/transport';

import {MessageType} from './constants';
import {IStoreCommunicationBridge} from './StoreCommunicationBridge';
import {shallowPatch} from './strategies/shallowDiff/patch';
import {
  DeserializerFn,
  IPegasusStore,
  PatchStrategyFn,
  PegasusStoreAction,
  PegasusStoreAnyAction,
  SerializerFn,
  StateDiff,
} from './types';

export type PegasusStoreProps<
  S,
  A extends PegasusStoreAction = PegasusStoreAnyAction,
> = {
  portName: string;
  serializer: SerializerFn<S | StateDiff | A>;
  deserializer: DeserializerFn<S | StateDiff | A>;
  patchStrategy?: PatchStrategyFn<S>;
  state?: S;
};

export class PegasusStore<
  S,
  A extends PegasusStoreAction = PegasusStoreAnyAction,
> implements IPegasusStore<S, A>
{
  private readonly bridge;
  private readonly serializer;
  private readonly deserializer;
  private readonly patchStrategy;

  private readyPromise: Promise<void>;
  private readyResolve: (() => void) | undefined;
  private readyResolved = false;
  private state: S;
  private listeners: Array<() => void>;

  constructor({
    portName,
    state = {} as S,
    serializer,
    deserializer,
    patchStrategy = shallowPatch,
  }: PegasusStoreProps<S, A>) {
    this.readyPromise = new Promise((resolve) => (this.readyResolve = resolve));
    this.serializer = serializer;
    this.deserializer = deserializer;
    this.listeners = [];
    this.state = state;

    this.bridge = getRPCService<IStoreCommunicationBridge<S, A>>(
      `PegasusStoreCommunicationBridgeFor-${portName}`,
      'background',
    );

    const {onBroadcastEvent} = definePegasusEventBus<IStoreEventBus>();

    // We request the latest available state data to initialise our store
    this.bridge
      .fetchState()
      .then((serializedState) => {
        this.replaceState(deserializer(serializedState) as S);

        // Resolve if readyPromise has not been resolved.
        if (!this.readyResolved) {
          this.readyResolved = true;
          this.readyResolve?.();
        }
      })
      .catch((err) => {
        console.error('Error initializing store: ', err);
      });

    this.patchStrategy = patchStrategy;

    onBroadcastEvent<string>(
      `pegasusStore/${portName}/${MessageType.STATE}`,
      (event) => {
        this.replaceState(deserializer(event.data) as S);

        if (!this.readyResolved) {
          this.readyResolved = true;
          this.readyResolve?.();
        }
      },
    );

    onBroadcastEvent<string>(
      `pegasusStore/${portName}/${MessageType.PATCH_STATE}`,
      (event) => {
        this.patchState(deserializer(event.data) as StateDiff);
      },
    );

    this.dispatch = this.dispatch.bind(this); // add this context to dispatch
  }

  /**
   * Returns a promise that resolves when the store is ready. Optionally a callback may be passed in instead.
   * @param [function] callback An optional callback that may be passed in and will fire when the store is ready.
   * @return {object} promise A promise that resolves when the store has established a connection with the background page.
   */
  ready(): Promise<void>;
  ready(cb: () => S): Promise<S>;
  ready(cb: null | (() => S) = null): Promise<S | void> {
    if (cb !== null) {
      return this.readyPromise.then(cb);
    }

    return this.readyPromise;
  }

  /**
   * Subscribes a listener function for all state changes
   * @param  {function} listener A listener function to be called when store state changes
   * @return {function}          An unsubscribe function which can be called to remove the listener from state updates
   */
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Replaces the state for only the keys in the updated state. Notifies all listeners of state change.
   * @param {object} state the new (partial) redux state
   */
  patchState(difference: StateDiff): void {
    this.state = this.patchStrategy(this.state, difference);
    this.listeners.forEach((l) => l());
  }

  /**
   * Replace the current state with a new state. Notifies all listeners of state change.
   * @param  {object} state The new state for the store
   */
  replaceState(state: S): void {
    this.state = state;

    this.listeners.forEach((l) => l());
  }

  /**
   * Get the current state of the store
   * @return {object} the current store state
   */
  getState(): S {
    return this.state;
  }

  /**
   * Dispatch an action to the background using messaging passing
   * @param  {object} data The action data to dispatch
   * @return {Promise}     Promise that will resolve/reject based on the action response from the background
   */
  async dispatch(data: A): Promise<A> {
    return this.deserializer(
      await this.bridge.dispatch(this.serializer(data)),
    ) as A;
  }
}
