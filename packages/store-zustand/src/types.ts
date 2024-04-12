export type ZustandAction<S> = {
  type: '__ZUSTAND_SYNC__';
  state: S;
};
