export function isValidState(state: unknown): state is Record<string, unknown> {
  return typeof state === 'object' && state !== null;
}
