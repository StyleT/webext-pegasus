import {Logger, LogLevels, LogObject} from './types';

const levelNumber: {[level in LogLevels]: number} = {
  debug: 1,
  error: 4,
  info: 2,
  trace: 0,
  warn: 3,
};

/**
 * A simple Logger interface implementation that logs to the console.
 */
export function consoleLogger(
  level: LogLevels = 'warn',
  context?: LogObject,
): Logger {
  return {
    child: (childObj: LogObject) =>
      consoleLogger(level, context ? {...context, ...childObj} : {...childObj}),
    /* eslint-disable no-console */
    debug: (...rest: unknown[]) => {
        if (levelNumber[level] <= 1) {
            if (context) {
                console.debug(context, ...rest);
            } else {
                console.debug(...rest);
            }
        }
    },
    error: (...rest: unknown[]) => {
        if (levelNumber[level] <= 4) {
            if (context) {
                console.error(context, ...rest);
            } else {
                console.error(...rest);
            }
        }
    },
    info: (...rest: unknown[]) => {
        if (levelNumber[level] <= 2) {
            if (context) {
                console.info(context, ...rest);
            } else {
                console.info(...rest);
            }
        }
    },
    trace: (...rest: unknown[]) => {
        if (levelNumber[level] <= 0) {
            if (context) {
                console.trace(context, ...rest);
            } else {
                console.trace(...rest);
            }
        }
    },
    warn: (...rest: unknown[]) => {
        if (levelNumber[level] <= 3) {
            if (context) {
                console.warn(context, ...rest);
            } else {
                console.warn(...rest);
            }
        }
    },
    /* eslint-enable no-console */
  };
}
