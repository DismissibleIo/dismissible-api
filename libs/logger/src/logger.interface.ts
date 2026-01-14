import { LoggerService, LogLevel as ConsoleLogLevel } from '@nestjs/common';

/**
 * Injection token for the logger provider.
 */
export const DISMISSIBLE_LOGGER = Symbol('DISMISSIBLE_LOGGER');

export type LogLevel = ConsoleLogLevel;

/**
 * Interface for logger providers.
 */
export type IDismissibleLogger = LoggerService;
