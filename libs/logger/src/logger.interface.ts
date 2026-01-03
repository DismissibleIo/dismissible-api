/**
 * Injection token for the logger provider.
 */
export const DISMISSIBLE_LOGGER = Symbol('DISMISSIBLE_LOGGER');

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'verbose';

/**
 * Interface for logger providers.
 */
export interface IDismissibleLogger {
  /**
   * Log a debug message.
   */
  debug(message: string, context?: object): void;

  /**
   * Log an info message.
   */
  info(message: string, context?: object): void;

  /**
   * Log a warning message.
   */
  warn(message: string, context?: object): void;

  /**
   * Log an error message.
   */
  error(message: string, error?: Error, context?: object): void;

  /**
   * Set the context for the logger.
   */
  setContext(context: string): void;

  /**
   * Set the log levels for the logger.
   */
  setLogLevels(levels: LogLevel[]): void;
}
