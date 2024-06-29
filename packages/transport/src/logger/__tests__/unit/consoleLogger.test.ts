/* eslint-disable no-console */
import {consoleLogger} from '../../consoleLogger';

// Mock the global console object
globalThis.console = {
  ...globalThis.console,
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  trace: jest.fn(),
  warn: jest.fn(),
};

describe('consoleLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log debug messages when level is debug', () => {
    const logger = consoleLogger('debug');
    logger.debug('Debug message');
    expect(console.debug).toHaveBeenCalledWith('Debug message');
  });

  it('should not log debug messages when level is higher than debug', () => {
    const logger = consoleLogger('info'); // info is a higher level than debug
    logger.debug('Debug message');
    expect(console.debug).not.toHaveBeenCalled();
  });

  it('should log error messages regardless of level', () => {
    const logger = consoleLogger('trace'); // Lowest level, should log everything
    logger.error('Error message');
    expect(console.error).toHaveBeenCalledWith('Error message');
  });

  it('should log info messages when level is info or lower', () => {
    const logger = consoleLogger('info');
    logger.info('Info message');
    expect(console.info).toHaveBeenCalledWith('Info message');
  });

  it('should include context in log messages if provided', () => {
    const context = {userId: 123};
    const logger = consoleLogger('debug', context);
    logger.debug('Debug message with context');
    expect(console.debug).toHaveBeenCalledWith(
      context,
      'Debug message with context',
    );
  });

  it('should correctly handle child loggers with additional context', () => {
    const parentContext = {userId: 123};
    const childContext = {operation: 'test'};
    const logger = consoleLogger('info', parentContext).child(childContext);
    logger.info('Info message from child logger');
    expect(console.info).toHaveBeenCalledWith(
      {...parentContext, ...childContext},
      'Info message from child logger',
    );
  });
});
