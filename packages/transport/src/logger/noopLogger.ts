import { Logger } from './types';

/**
 * A Logger interface implementation that does nothing.
 */
export function noopLogger(): Logger {
    return {
        child: () => noopLogger(),
        debug: () => {},
        error: () => {},
        info: () => {},
        trace: () => {},
        warn: () => {},
    }
}
