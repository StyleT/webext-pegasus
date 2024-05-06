export interface IRPCMessaging {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (message: {args: any[]; path: string | null}) => unknown;
}
