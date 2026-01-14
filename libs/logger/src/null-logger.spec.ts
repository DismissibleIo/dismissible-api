import { NullLogger } from './null-logger';
import { LogLevel } from './logger.interface';

describe('NullLogger', () => {
  let logger: NullLogger;

  beforeEach(() => {
    logger = new NullLogger();
  });

  describe('log', () => {
    it('should not throw when called without context', () => {
      expect(() => logger.log('test message')).not.toThrow();
    });

    it('should not throw when called with context', () => {
      expect(() => logger.log('test message', { key: 'value' })).not.toThrow();
    });
  });

  describe('error', () => {
    it('should not throw when called without context', () => {
      expect(() => logger.error('error message')).not.toThrow();
    });

    it('should not throw when called with context', () => {
      expect(() => logger.error('error message', { error: 'details' })).not.toThrow();
    });
  });

  describe('warn', () => {
    it('should not throw when called without context', () => {
      expect(() => logger.warn('warning message')).not.toThrow();
    });

    it('should not throw when called with context', () => {
      expect(() => logger.warn('warning message', { warning: 'details' })).not.toThrow();
    });
  });

  describe('debug', () => {
    it('should not throw when called without context', () => {
      expect(() => logger.debug('debug message')).not.toThrow();
    });

    it('should not throw when called with context', () => {
      expect(() => logger.debug('debug message', { debug: 'details' })).not.toThrow();
    });
  });

  describe('setContext', () => {
    it('should not throw when called', () => {
      expect(() => logger.setContext('TestContext')).not.toThrow();
    });
  });

  describe('setLogLevels', () => {
    it('should not throw when called with levels', () => {
      const levels: LogLevel[] = ['log', 'warn', 'error'];
      expect(() => logger.setLogLevels(levels)).not.toThrow();
    });

    it('should not throw when called with empty array', () => {
      expect(() => logger.setLogLevels([])).not.toThrow();
    });
  });
});
