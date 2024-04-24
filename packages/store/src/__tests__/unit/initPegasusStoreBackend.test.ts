import {describe, it, jest} from '@jest/globals';
import {randomUUID} from 'crypto';

import {
  addPegasusEventHandler,
  sendMessage,
} from '../../../../../test-utils/testPegasus';
import {getMessageKey} from '../../../../rpc/src/utils/getMessageKey';
import {MessageType} from '../../constants';
import {initPegasusStoreBackend} from '../../initPegasusStoreBackend';
import {ChangeType} from '../../strategies/constants';
import {Dispatch, IPegasusStore} from '../../types';

describe('initPegasusStoreBackend', () => {
  const noop = <T>(payload: T): T => payload;

  describe('on receiving messages', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let store: IPegasusStore<any, any>,
      payload: object,
      dispatch: jest.Mock<Dispatch>;

    beforeEach(function () {
      dispatch = jest.fn((action) => Promise.resolve(action));
      store = {
        dispatch: dispatch,
        getState: () => ({}),
        subscribe: () => {
          return () => ({});
        },
      };

      payload = {
        a: 'a',
      };
    });

    it('should dispatch actions received on onMessage to store', function () {
      const portName = randomUUID();

      initPegasusStoreBackend(store, {
        deserializer: noop,
        portName,
        serializer: noop,
      });

      sendMessage(
        getMessageKey(`PegasusStoreCommunicationBridgeFor-${portName}`),
        payload,
      );

      expect(dispatch.mock.calls).toHaveLength(1);
      expect(dispatch.mock.calls[0]).toEqual([payload]);
    });

    it('should deserialize incoming messages correctly', async function () {
      const portName = randomUUID();
      const deserializer = JSON.parse;
      const serializer = JSON.stringify;

      initPegasusStoreBackend(store, {
        deserializer,
        portName,
        serializer,
      });

      const testPayload = serializer(payload);
      expect(
        await sendMessage(
          getMessageKey(`PegasusStoreCommunicationBridgeFor-${portName}`),
          testPayload,
        ),
      ).toEqual(serializer(payload));

      expect(dispatch.mock.calls).toHaveLength(1);
      expect(dispatch.mock.calls[0]).toEqual([payload]);

      (dispatch.mock.results[0].value as Promise<unknown>).then((action) => {
        expect(action).toEqual(payload);
      });
    });
  });

  it('should serialize initial state and subsequent patches correctly', function () {
    const portName = randomUUID();
    const onEventInitHandler = jest.fn();
    addPegasusEventHandler(
      `pegasusStore/${portName}/${MessageType.STATE}`,
      onEventInitHandler,
    );
    const onEventPatchHandler = jest.fn();
    addPegasusEventHandler(
      `pegasusStore/${portName}/${MessageType.PATCH_STATE}`,
      onEventPatchHandler,
    );

    // Stub state access (the first access will be on
    // initialization, and the second will be on update)
    const firstState = {a: 1, b: 2};
    const secondState = {a: 1, b: 3, c: 5};

    const dispatch: jest.Mock<Dispatch> = jest.fn((action) =>
      Promise.resolve(action),
    );
    const getState = jest
      .fn(() => ({}))
      .mockReturnValueOnce(firstState)
      .mockReturnValue(secondState);

    // Mock store subscription
    const subscribers: Array<() => void> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store: IPegasusStore<any, any> = {
      dispatch,
      getState,
      subscribe: (subscriber) => {
        subscribers.push(subscriber);
        return () => ({});
      },
    };

    const serializer = JSON.stringify;
    const deserializer = JSON.parse;

    // Create a fake diff strategy
    const diffStrategy = (oldObj: unknown, newObj: unknown) => [
      {
        change: ChangeType.UPDATED,
        key: 'testKey',
        value: {
          newObj,
          oldObj,
        },
      },
    ];

    initPegasusStoreBackend(store, {
      deserializer,
      diffStrategy,
      portName,
      serializer,
    });

    // Simulate a state update by calling subscribers
    subscribers.forEach((subscriber) => subscriber());

    expect(onEventInitHandler.mock.calls).toHaveLength(1);
    expect(onEventInitHandler.mock.calls[0][0]).toEqual(serializer(firstState));

    expect(onEventPatchHandler.mock.calls).toHaveLength(1);
    expect(onEventPatchHandler.mock.calls[0][0]).toEqual(
      serializer(diffStrategy(firstState, secondState)),
    );

    // Simulate a state update by calling subscribers
    subscribers.forEach((subscriber) => subscriber());
  });

  it("should not send patches if state hasn't been changed", function () {
    const portName = randomUUID();
    const onEventPatchHandler = jest.fn();
    addPegasusEventHandler(
      `pegasusStore/${portName}/${MessageType.PATCH_STATE}`,
      onEventPatchHandler,
    );

    // Stub state access (the first access will be on
    // initialization, and the second will be on update)
    const firstState = {a: 1, b: 2};
    const secondState = {a: 1, b: 3, c: 5};

    const dispatch: jest.Mock<Dispatch> = jest.fn((action) =>
      Promise.resolve(action),
    );
    const getState = jest
      .fn(() => ({}))
      .mockReturnValueOnce(firstState)
      .mockReturnValue(secondState);

    // Mock store subscription
    const subscribers: Array<() => void> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store: IPegasusStore<any, any> = {
      dispatch,
      getState,
      subscribe: (subscriber) => {
        subscribers.push(subscriber);
        return () => ({});
      },
    };

    const serializer = noop;
    const deserializer = noop;

    initPegasusStoreBackend(store, {
      deserializer,
      portName,
      serializer,
    });

    // Simulate a state update by calling subscribers
    subscribers.forEach((subscriber) => subscriber());

    expect(onEventPatchHandler.mock.calls).toHaveLength(1);

    // Simulate a state update by calling subscribers
    subscribers.forEach((subscriber) => subscriber());

    // No more patches should be sent as state has not changed
    expect(onEventPatchHandler.mock.calls).toHaveLength(1);
  });
});
