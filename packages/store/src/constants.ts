// eslint-disable-next-line no-shadow
export enum MessageType {
  // Message type for state update events from
  // background to Proxy Stores
  STATE = 'chromex.state',

  // Message type for state patch events from
  // background to Proxy Stores
  PATCH_STATE = 'chromex.patch_state',
}
