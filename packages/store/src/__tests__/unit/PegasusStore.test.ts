import {describe, it} from '@jest/globals';
import {randomUUID} from 'crypto';

import {
    addPegasusMessageHandler,
} from '../../../../../test-utils/testPegasus';
import {getMessageKey} from '../../../../rpc/src/utils/getMessageKey';
import {PegasusStore} from '../../PegasusStore';

describe('PegasusStore', function () {

  describe('#new PegasusStore()', function () {
    let portName: string;

    beforeEach(() => {
      portName = randomUUID();
    });

    it('should set the initial state to empty object by default', async function () {
      const bgInitState = {a: 1};
        addPegasusMessageHandler(getMessageKey(`PegasusStoreCommunicationBridgeFor-${portName}`), message => {
          return JSON.stringify(bgInitState);
        })
        const store = new PegasusStore({deserializer: JSON.parse, portName, serializer: JSON.stringify});

        expect(store.getState()).toEqual({});
        await store.ready();

        expect(store.getState()).toEqual(bgInitState);
      });

    // it('should setup a listener on the chrome port defined by the portName option', function () {
    //   new PegasusStore({portName, serializer: JSON.stringify, deserializer: JSON.parse});

    //   spy.calledOnce.should.eql(true);
    //   spy
    //     .alwaysCalledWith(null, {
    //       portName,
    //       type: FETCH_STATE_TYPE,
    //     })
    //     .should.eql(true);
    // });

//     it('should call replaceState on new state messages', function () {
//       const store = new PegasusStore({portName});

//       // make replaceState() a spy function
//       store.replaceState = sinon.spy();

//       const [l] = listeners;

//       const payload = {
//         a: 1,
//       };

//       // send one state type message
//       l({
//         payload,
//         portName,
//         type: STATE_TYPE,
//       });

//       // send one non-state type message
//       l({
//         payload: {
//           a: 2,
//         },
//         type: `NOT_${STATE_TYPE}`,
//       });

//       // make sure replace state was only called once
//       store.replaceState.calledOnce.should.equal(true);
//       store.replaceState.firstCall.args[0].should.eql(payload);
//     });

//     it('should deserialize incoming messages', function () {
//       const deserializer = sinon.spy(JSON.parse);
//       const store = new PegasusStore({deserializer, portName});

//       // make replaceState() a spy function
//       store.replaceState = sinon.spy();

//       const [l] = listeners;

//       const payload = {
//         a: 1,
//       };

//       // send one state type message
//       l({
//         payload: JSON.stringify(payload),
//         portName,
//         type: STATE_TYPE,
//       });

//       // send one non-state type message
//       l({
//         payload: JSON.stringify({
//           a: 2,
//         }),
//         type: `NOT_${STATE_TYPE}`,
//       });

//       // make sure replace state was called with the deserialized payload
//       store.replaceState.firstCall.args[0].should.eql(payload);
//     });

//     it('should set the initial state to empty object by default', function () {
//       const store = new PegasusStore({portName});

//       store.getState().should.eql({});
//     });

//     it('should set the initial state to opts.state if available', function () {
//       const store = new PegasusStore({portName, state: {a: 'a'}});

//       store.getState().should.eql({a: 'a'});
//     });

//     it('should setup a initializeStore listener', function () {
//       // mock onMessage listeners array
//       const initializeStoreListener = [];

//       // override mock chrome API for this test
//       self.chrome.runtime.sendMessage = (
//         extensionId,
//         message,
//         options,
//         listener,
//       ) => {
//         initializeStoreListener.push(listener);
//       };

//       const store = new PegasusStore({portName});

//       // verify one listener was added on port connect
//       initializeStoreListener.length.should.equal(1);

//       const [l] = initializeStoreListener;

//       // make readyResolve() a spy function
//       store.readyResolve = sinon.spy();

//       const payload = {
//         a: 1,
//       };

//       // Receive message response
//       l({payload, type: FETCH_STATE_TYPE});

//       store.readyResolved.should.eql(true);
//       store.readyResolve.calledOnce.should.equal(true);
//     });

//     it('should listen only to portName state changes', function () {
//       // mock onMessage listeners array
//       const stateChangesListener = [];

//       // override mock chrome API for this test
//       self.chrome.runtime = {
//         onMessage: {
//           addListener: (listener) => {
//             stateChangesListener.push(listener);
//           },
//         },
//         sendMessage: () => {},
//       };

//       const store = new PegasusStore({portName});
//       const portName2 = 'test2';
//       const store2 = new PegasusStore({portName: portName2});

//       // verify one listener was added on port connect
//       stateChangesListener.length.should.equal(2);

//       const [l1, l2] = stateChangesListener;

//       // make readyResolve() a spy function
//       store.readyResolve = sinon.spy();
//       store2.readyResolve = sinon.spy();

//       // send message for port 1
//       l1({
//         payload: [{change: 'updated', key: 'a', value: '1'}],
//         portName,
//         type: STATE_TYPE,
//       });
//       l2({
//         payload: [{change: 'updated', key: 'b', value: '2'}],
//         portName,
//         type: STATE_TYPE,
//       });

//       stateChangesListener.length.should.equal(2);

//       store.readyResolved.should.eql(true);
//       store.readyResolve.calledOnce.should.equal(true);
//       store2.readyResolved.should.eql(false);
//       store2.readyResolve.calledOnce.should.equal(false);

//       // send message for port 2
//       l1({
//         payload: [{change: 'updated', key: 'a', value: '1'}],
//         portName: portName2,
//         type: STATE_TYPE,
//       });
//       l2({
//         payload: [{change: 'updated', key: 'b', value: '2'}],
//         portName: portName2,
//         type: STATE_TYPE,
//       });
//       stateChangesListener.length.should.equal(2);
//       store.readyResolved.should.eql(true);
//       store.readyResolve.calledOnce.should.equal(true);
//       store2.readyResolved.should.eql(true);
//       store2.readyResolve.calledOnce.should.equal(true);
//     });
});

//   describe('#patchState()', function () {
//     it('should patch the state of the store', function () {
//       const store = new PegasusStore({portName, state: {b: 1}});

//       store.getState().should.eql({b: 1});

//       store.patchState([
//         {change: DIFF_STATUS_UPDATED, key: 'a', value: 123},
//         {change: DIFF_STATUS_REMOVED, key: 'b'},
//       ]);

//       store.getState().should.eql({a: 123});
//     });

//     it('should use the provided patch strategy to patch the state', function () {
//       // Create a fake patch strategy
//       const patchStrategy = sinon.spy((state) => ({
//         ...state,
//         a: state.a + 1,
//       }));
//       // Initialize the store
//       const store = new PegasusStore({
//         patchStrategy,
//         portName,
//         state: {a: 1, b: 5},
//       });

//       store.getState().should.eql({a: 1, b: 5});

//       // Patch the state
//       store.patchState([]);

//       const expectedState = {a: 2, b: 5};

//       // make sure the patch strategy was used
//       patchStrategy.callCount.should.eql(1);
//       // make sure the state got patched
//       store.state.should.eql(expectedState);
//     });
//   });

//   describe('#replaceState()', function () {
//     it('should replace the state of the store', function () {
//       const store = new PegasusStore({portName});

//       store.getState().should.eql({});

//       store.replaceState({a: 'a'});

//       store.getState().should.eql({a: 'a'});
//     });
//   });

//   describe('#getState()', function () {
//     it('should get the current state of the Store', function () {
//       const store = new PegasusStore({portName, state: {a: 'a'}});

//       store.getState().should.eql({a: 'a'});

//       store.replaceState({b: 'b'});

//       store.getState().should.eql({b: 'b'});
//     });
//   });

//   describe('#subscribe()', function () {
//     it('should register a listener for state changes', function () {
//       const store = new PegasusStore({portName});
//       const newState = {b: 'b'};

//       let callCount = 0;

//       store.subscribe(() => {
//         callCount += 1;
//         store.getState().should.eql(newState);
//       });

//       store.replaceState(newState);

//       callCount.should.eql(1);
//     });

//     it('should return a function which will unsubscribe the listener', function () {
//       const store = new PegasusStore({portName});
//       const listener = sinon.spy();
//       const unsub = store.subscribe(listener);

//       store.replaceState({b: 'b'});

//       listener.calledOnce.should.eql(true);

//       unsub();

//       store.replaceState({c: 'c'});

//       listener.calledOnce.should.eql(true);
//     });
//   });

//   describe('#dispatch()', function () {
//     it('should send a message with the correct dispatch type and payload given an extensionId', function () {
//       const spy = (self.chrome.runtime.sendMessage = sinon.spy());
//       const store = new PegasusStore({extensionId: 'xxxxxxxxxxxx', portName});

//       store.dispatch({a: 'a'});

//       spy.callCount.should.eql(2);
//       spy.args[0][0].should.eql('xxxxxxxxxxxx');
//       spy.args[0][1].should.eql({portName: 'test', type: FETCH_STATE_TYPE});
//       spy.args[1][0].should.eql('xxxxxxxxxxxx');
//       spy.args[1][1].should.eql({
//         payload: {a: 'a'},
//         portName: 'test',
//         type: DISPATCH_TYPE,
//       });
//     });

//     it('should send a message with the correct dispatch type and payload not given an extensionId', function () {
//       const spy = (self.chrome.runtime.sendMessage = sinon.spy());
//       const store = new PegasusStore({portName});

//       store.dispatch({a: 'a'});

//       spy.callCount.should.eql(2);

//       should(spy.args[0][0]).eql(null);
//       spy.args[0][1].should.eql({portName: 'test', type: FETCH_STATE_TYPE});
//       should(spy.args[1][0]).eql(null);
//       spy.args[1][1].should.eql({
//         payload: {a: 'a'},
//         portName: 'test',
//         type: DISPATCH_TYPE,
//       });
//     });

//     it('should serialize payloads before sending', function () {
//       const spy = (self.chrome.runtime.sendMessage = sinon.spy());
//       const serializer = sinon.spy(JSON.stringify);
//       const store = new PegasusStore({portName, serializer});

//       store.dispatch({a: 'a'});

//       spy.callCount.should.eql(2);

//       should(spy.args[0][0]).eql(null);
//       spy.args[0][1].should.eql({portName: 'test', type: FETCH_STATE_TYPE});
//       should(spy.args[1][0]).eql(null);
//       spy.args[1][1].should.eql({
//         payload: JSON.stringify({a: 'a'}),
//         portName: 'test',
//         type: DISPATCH_TYPE,
//       });
//     });

//     it('should return a promise that resolves with successful action', function () {
//       self.chrome.runtime.sendMessage = (extensionId, data, options, cb) => {
//         cb({value: {payload: 'hello'}});
//       };

//       const store = new PegasusStore({portName});
//       const p = store.dispatch({a: 'a'});

//       return p.should.be.fulfilledWith('hello');
//     });

//     it('should return a promise that rejects with an action error', function () {
//       self.chrome.runtime.sendMessage = (extensionId, data, options, cb) => {
//         cb({error: {extraMsg: 'test'}, value: {payload: 'hello'}});
//       };

//       const store = new PegasusStore({portName});
//       const p = store.dispatch({a: 'a'});

//       return p.should.be.rejectedWith(Error, {extraMsg: 'test'});
//     });

//     it('should return a promise that resolves with undefined for an undefined return value', function () {
//       self.chrome.runtime.sendMessage = (extensionId, data, options, cb) => {
//         cb({value: undefined});
//       };

//       const store = new PegasusStore({portName});
//       const p = store.dispatch({a: 'a'});

//       return p.should.be.fulfilledWith(undefined);
//     });
//   });

//   describe('when validating options', function () {
//     it('should use defaults if no options present', function () {
//       should.doesNotThrow(() => new PegasusStore());
//     });

//     it('should throw an error if serializer is not a function', function () {
//       should.throws(() => {
//         new PegasusStore({portName, serializer: 'abc'});
//       }, Error);
//     });

//     it('should throw an error if deserializer is not a function', function () {
//       should.throws(() => {
//         new PegasusStore({deserializer: 'abc', portName});
//       }, Error);
//     });

//     it('should throw an error if patchStrategy is not a function', function () {
//       should.throws(() => {
//         new PegasusStore({patchStrategy: 'abc', portName});
//       }, Error);
//     });
//   });
});
