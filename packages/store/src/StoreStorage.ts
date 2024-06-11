import {definePegasusBrowserAPI} from '@webext-pegasus/transport';

import {
  DeserializerFn,
  PegasusStoreAction,
  PegasusStoreAnyAction,
  SerializerFn,
} from './types';

export type StoreStorageStrategy = 'local' | 'session' | 'sync' | undefined;

export class StoreStorage<
  S,
  A extends PegasusStoreAction = PegasusStoreAnyAction,
> {
  private readonly browser;
  constructor(
    private readonly storeName: string,
    private readonly storageStrategy: StoreStorageStrategy,
    private readonly serializer: SerializerFn<S | A>,
    private readonly deserializer: DeserializerFn<S | A>,
  ) {
    const browser = definePegasusBrowserAPI();
    if (browser === null) {
      throw new Error('Browser API not available');
    }
    this.browser = browser;
  }

  async getState(): Promise<S | undefined> {
    if (this.storageStrategy === undefined) {
      return undefined;
    }

    this.checkPermissions();

    const key = this.getStorageKey();

    const {[key]: stateStr} = await this.getStoreStorage()
      .get(key)
      .catch((error) => {
        console.error(
          `Error loading Pegasus Store "${this.storeName}" state from storage.`,
          error,
        );

        return {[key]: undefined};
      });

    let state: S | undefined = undefined;
    if (typeof stateStr === 'string') {
      try {
        state = this.deserializer(stateStr) as S;
      } catch (err) {
        console.warn('Error deserializing preloaded state:', err, stateStr);
      }
    }

    return state;
  }

  async setState(state: S): Promise<void> {
    if (this.storageStrategy === undefined) {
      return;
    }
    this.checkPermissions();

    const key = this.getStorageKey();

    await this.getStoreStorage()
      .set({
        [key]: this.serializer(state),
      })
      .catch((error) => {
        console.error(
          `Error saving Pegasus Store "${this.storeName}" state to storage.`,
          error,
        );
      });
  }

  private getStorageKey() {
    return `pegasus-store/${this.storeName}`;
  }

  private getStoreStorage() {
    const storageStrategySetting = this.storageStrategy ?? 'session';

    return this.browser.storage[storageStrategySetting];
  }

  private checkPermissions() {
    if (this.browser.storage === undefined) {
      throw new Error(
        'Error initializing storage for Pegasus Store, ensure that you have "storage" permission enabled for your extension.',
      );
    }
  }
}
