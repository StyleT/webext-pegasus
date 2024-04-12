export function getMessageKey(serviceName: string): string {
  return `pegasus-rpc-service.${serviceName}`;
}
