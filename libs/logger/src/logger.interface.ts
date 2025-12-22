/**
 * Injection token for the logger provider.
 */
export const DISMISSIBLE_LOGGER = Symbol('DISMISSIBLE_LOGGER');

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
}
