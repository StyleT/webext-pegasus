import {describe, it} from '@jest/globals';
import {randomUUID} from 'crypto';

import {
  addPegasusMessageHandler,
  emitEvent,
  resetPegasus,
} from '../../../../../test-utils/testPegasus';
import {getMessageKey} from '../../../../rpc/src/utils/getMessageKey';
import {MessageType} from '../../constants';
import {PegasusStore, PegasusStoreProps} from '../../PegasusStore';
import {ChangeType} from '../../strategies/constants';

function createStore({
  portName,
  bgInitState,
  deserializer,
  serializer,
  state,
  patchStrategy,
}: PegasusStoreProps<object> & {bgInitState: object}): PegasusStore<object> {
  addPegasusMessageHandler(
    getMessageKey(`PegasusStoreCommunicationBridgeFor-${portName}`),
    () => {
      return JSON.stringify(bgInitState);
    },
  );
  return new PegasusStore({
    deserializer,
    patchStrategy,
    portName,
    serializer,
    state,
  });
}

describe('PegasusStore', function () {
  let portName: string;

  beforeEach(() => {
    portName = randomUUID();
    resetPegasus();
  });

  describe('#new PegasusStore()', function () {
    it('should set the initial state to empty object by default and then load state from background SW', async function () {
      const deserializer = JSON.parse;
      const serializer = JSON.stringify;
      const bgInitState = {a: 1};
      const store = createStore({
        bgInitState,
        deserializer,
        portName,
        serializer,
      });

      // Checking that the initial state is empty as initial state is not loaded yet
      expect(store.getState()).toEqual({});

      // Waiting for the background SW to send the initial state
      await store.ready();

      // Checking that the initial state was loaded
      expect(store.getState()).toEqual(bgInitState);
    });

    it('should call replaceState on new state messages', async function () {
      const deserializer = JSON.parse;
      const serializer = JSON.stringify;

      const store = createStore({
        bgInitState: {},
        deserializer,
        portName,
        serializer,
      });
      const replaceStateSpy = jest.spyOn(store, 'replaceState');

      expect(replaceStateSpy).toHaveBeenCalledTimes(0);

      await store.ready();
      // Checking that the initial state is empty as expected
      expect(store.getState()).toEqual({});
      expect(replaceStateSpy).toHaveBeenCalledTimes(1);

      let payload: {[key: string]: number} = {
        a: 1,
      };

      // send state type message
      await emitEvent(
        `pegasusStore/${portName}/${MessageType.STATE}`,
        serializer(payload),
      );

      expect(replaceStateSpy).toHaveBeenCalledTimes(2);
      expect(replaceStateSpy).toHaveBeenNthCalledWith(2, payload);
      expect(store.getState()).toEqual(payload);

      payload = {
        a: 1,
        b: 2,
      };

      // send state type message
      await emitEvent(
        `pegasusStore/${portName}/${MessageType.STATE}`,
        serializer(payload),
      );

      expect(replaceStateSpy).toHaveBeenCalledTimes(3);
      expect(replaceStateSpy).toHaveBeenNthCalledWith(3, payload);
      expect(store.getState()).toEqual(payload);
    });

    it('should set the initial state to opts.state if available', async function () {
      const initState = {b: 2};
      const bgInitState = {c: 3};
      const store = createStore({
        bgInitState,
        deserializer: JSON.parse,
        portName,
        serializer: JSON.stringify,
        state: initState,
      });

      expect(store.getState()).toEqual(initState);

      await store.ready();
      expect(store.getState()).toEqual(bgInitState);
    });
  });

  describe('#patchState()', function () {
    it('should patch the state of the store', async function () {
      const bgInitState = {b: 1};
      const store = createStore({
        bgInitState,
        deserializer: JSON.parse,
        portName,
        serializer: JSON.stringify,
      });
      await store.ready();
      expect(store.getState()).toEqual(bgInitState);

      store.patchState([
        {change: ChangeType.UPDATED, key: 'a', value: 123},
        {change: ChangeType.REMOVED, key: 'b'},
      ]);

      expect(store.getState()).toEqual({a: 123});
    });

    it('should use the provided patch strategy to patch the state', async function () {
      // Create a fake patch strategy
      const patchStrategy = jest.fn((state) => ({
        ...state,
        a: state.a + 1,
      }));

      // Initialize the store
      const bgInitState = {a: 1, b: 5};
      const store = createStore({
        bgInitState,
        deserializer: JSON.parse,
        patchStrategy,
        portName,
        serializer: JSON.stringify,
      });
      await store.ready();
      expect(store.getState()).toEqual(bgInitState);

      // Patch the state
      store.patchState([]);

      // make sure the state got patched (a key was incremented)
      const expectedState = {a: 2, b: 5};
      expect(store.getState()).toEqual(expectedState);

      // make sure the patch strategy was used
      expect(patchStrategy).toHaveBeenCalledTimes(1);
    });
  });

  describe('#replaceState()', function () {
    it('should replace the state of the store', async function () {
      const bgInitState = {a: 1};
      const store = createStore({
        bgInitState,
        deserializer: JSON.parse,
        portName,
        serializer: JSON.stringify,
      });
      await store.ready();
      expect(store.getState()).toEqual(bgInitState);

      const newState = {b: 2};

      store.replaceState(newState);
      expect(store.getState()).toEqual(newState);
    });
  });

  describe('#getState()', function () {
    it('should get the current state of the Store', async function () {
      const bgInitState = {a: 1};
      const store = createStore({
        bgInitState,
        deserializer: JSON.parse,
        portName,
        serializer: JSON.stringify,
      });
      await store.ready();
      expect(store.getState()).toEqual(bgInitState);
    });
  });

  describe('#subscribe()', function () {
    it('should register a listener for state changes', async function () {
      const bgInitState = {a: 1};
      const store = createStore({
        bgInitState,
        deserializer: JSON.parse,
        portName,
        serializer: JSON.stringify,
      });
      await store.ready();

      const newState = {b: 'b'};

      let callCount = 0;
      store.subscribe(() => {
        callCount += 1;
        expect(store.getState()).toEqual(newState);
      });

      store.replaceState(newState);

      expect(callCount).toEqual(1);
    });

    it('should return a function which will unsubscribe the listener', async function () {
      const bgInitState = {a: 1};
      const store = createStore({
        bgInitState,
        deserializer: JSON.parse,
        portName,
        serializer: JSON.stringify,
      });
      await store.ready();

      const listener = jest.fn();
      const unsub = store.subscribe(listener);

      store.replaceState({b: 'b'});

      expect(listener).toHaveBeenCalledTimes(1);

      unsub();

      store.replaceState({c: 'c'});

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('#dispatch()', function () {
    it('should send a message with the correct dispatch type and payload', async function () {
      const bgInitState = {b: 1};

      const messageHandler = jest
        .fn()
        .mockReturnValueOnce(JSON.stringify(bgInitState))
        .mockReturnValue('{}');

      addPegasusMessageHandler(
        getMessageKey(`PegasusStoreCommunicationBridgeFor-${portName}`),
        messageHandler,
      );
      const serializer = JSON.stringify;
      const store = new PegasusStore<object>({
        deserializer: JSON.parse,
        portName,
        serializer,
      });
      await store.ready();

      const dispatchedValue = {a: 'a', type: 'test'};
      store.dispatch(dispatchedValue);
      expect(messageHandler.mock.calls[1][0].data).toEqual({
        args: [
          // should serialize payloads before sending
          serializer(dispatchedValue),
        ],
        path: 'dispatch',
      });
    });

    it('should return a promise that resolves with successful action', async function () {
      const serializer = JSON.stringify;

      const bgInitState = {b: 1};
      const dispatchedValue = {a: 'a', type: 'test'};

      const messageHandler = jest
        .fn()
        .mockReturnValueOnce(JSON.stringify(bgInitState))
        .mockReturnValue(serializer(dispatchedValue));

      addPegasusMessageHandler(
        getMessageKey(`PegasusStoreCommunicationBridgeFor-${portName}`),
        messageHandler,
      );
      const store = new PegasusStore<object>({
        deserializer: JSON.parse,
        portName,
        serializer,
      });
      await store.ready();

      expect(store.dispatch(dispatchedValue)).resolves.toEqual(dispatchedValue);
    });

    it('should return a promise that rejects with an action error', async function () {
      const serializer = JSON.stringify;
      const error = new Error('test error');

      const bgInitState = {b: 1};
      const dispatchedValue = {a: 'a', type: 'test'};

      const messageHandler = jest
        .fn()
        .mockReturnValueOnce(JSON.stringify(bgInitState))
        .mockRejectedValue(error);

      addPegasusMessageHandler(
        getMessageKey(`PegasusStoreCommunicationBridgeFor-${portName}`),
        messageHandler,
      );
      const store = new PegasusStore<object>({
        deserializer: JSON.parse,
        portName,
        serializer,
      });
      await store.ready();

      expect(store.dispatch(dispatchedValue)).rejects.toThrow(error);
    });
  });
});
