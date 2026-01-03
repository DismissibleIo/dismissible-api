import { ConsoleLogger } from '@nestjs/common';
import { Logger } from './logger';
import { LogLevel } from './logger.interface';

describe('Logger', () => {
  let logger: Logger;
  let superLogSpy: jest.SpyInstance;
  let superSetLogLevelsSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new Logger();
    superLogSpy = jest.spyOn(ConsoleLogger.prototype, 'log').mockImplementation();
    superSetLogLevelsSpy = jest.spyOn(ConsoleLogger.prototype, 'setLogLevels').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('info', () => {
    it('should call super.log with message when no context is provided', () => {
      logger.info('test message');

      expect(superLogSpy).toHaveBeenCalledWith('test message');
      expect(superLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should call super.log with message and context when context is provided', () => {
      const context = ['context1', 'context2'];
      logger.info('test message', context);

      expect(superLogSpy).toHaveBeenCalledWith('test message', context);
      expect(superLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should not pass context when context is undefined', () => {
      logger.info('test message', undefined);

      expect(superLogSpy).toHaveBeenCalledWith('test message');
      expect(superLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should pass context when context is an empty array', () => {
      logger.info('test message', []);

      expect(superLogSpy).toHaveBeenCalledWith('test message', []);
      expect(superLogSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('setLogLevels', () => {
    it('should convert "info" level to "log" when calling super', () => {
      const levels: LogLevel[] = ['info', 'warn', 'error'];

      logger.setLogLevels(levels);

      expect(superSetLogLevelsSpy).toHaveBeenCalledWith(['log', 'warn', 'error']);
    });

    it('should pass through other levels unchanged', () => {
      const levels: LogLevel[] = ['debug', 'warn', 'error', 'fatal', 'verbose'];

      logger.setLogLevels(levels);

      expect(superSetLogLevelsSpy).toHaveBeenCalledWith([
        'debug',
        'warn',
        'error',
        'fatal',
        'verbose',
      ]);
    });

    it('should handle array with only "info" level', () => {
      const levels: LogLevel[] = ['info'];

      logger.setLogLevels(levels);

      expect(superSetLogLevelsSpy).toHaveBeenCalledWith(['log']);
    });

    it('should handle empty array', () => {
      logger.setLogLevels([]);

      expect(superSetLogLevelsSpy).toHaveBeenCalledWith([]);
    });

    it('should handle multiple "info" levels', () => {
      const levels: LogLevel[] = ['info', 'debug', 'info'];

      logger.setLogLevels(levels);

      expect(superSetLogLevelsSpy).toHaveBeenCalledWith(['log', 'debug', 'log']);
    });
  });
});
