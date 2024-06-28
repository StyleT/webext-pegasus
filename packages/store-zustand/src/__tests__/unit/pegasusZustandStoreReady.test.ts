import {PegasusStore} from '@webext-pegasus/store';
import {type StoreApi, create} from 'zustand';

import {pegasusZustandStoreReady} from '../../pegasusZustandStoreReady';

const PegasusStoreMock = {
  dispatch: jest.fn(),
  getState: jest.fn(),
  ready: jest.fn(),
  subscribe: jest.fn(),
};
jest.mock('@webext-pegasus/store', () => ({
  ...jest.requireActual('@webext-pegasus/store'),
  PegasusStore: jest.fn().mockImplementation(() => PegasusStoreMock),
}));

interface BearState {
  bears: number;
  increase: (by: number) => void;
}

describe('pegasusZustandStoreReady', () => {
  const storeName = 'testStore';
  const initialState = {bears: 777};
  let store: StoreApi<BearState>;

  beforeEach(() => {
    store = create<BearState>((set) => ({
      bears: 0,
      increase: (by) => set((state) => ({bears: state.bears + by})),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    (PegasusStore as jest.MockedClass<typeof PegasusStore>).mockClear();
  });

  it('returns the original store if already registered and ready', async () => {
    PegasusStoreMock.ready.mockResolvedValueOnce(undefined);
    const readyStore = await pegasusZustandStoreReady(storeName, store);
    expect(readyStore).toBe(store);
  });

  it('correctly handles race condition during store initialization', async () => {
    PegasusStoreMock.ready.mockResolvedValueOnce(undefined);
    const readyStores = await Promise.all([
      pegasusZustandStoreReady(storeName, store),
      pegasusZustandStoreReady(storeName, store),
    ]);
    expect(readyStores[0]).toBe(store);
    expect(readyStores[0]).toBe(store);
    expect(PegasusStoreMock.getState).toHaveBeenCalledTimes(1);
    expect(PegasusStoreMock.ready).toHaveBeenCalledTimes(1);
  });

  it('updates the original store state with the state from PegasusStore after it is ready', async () => {
    PegasusStoreMock.ready.mockResolvedValueOnce(undefined);
    PegasusStoreMock.getState.mockReturnValueOnce(initialState);

    const readyStore = await pegasusZustandStoreReady(storeName, store);
    expect(readyStore.getState().bears).toEqual(initialState.bears);
  });
});
