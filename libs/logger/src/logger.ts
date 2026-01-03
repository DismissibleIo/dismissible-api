import { ConsoleLogger, LogLevel as ConsoleLogLevel } from '@nestjs/common';
import { IDismissibleLogger, LogLevel } from './logger.interface';

export class Logger extends ConsoleLogger implements IDismissibleLogger {
  info(message: string, context?: any[]): void {
    if (context) {
      super.log(message, context);
    } else {
      super.log(message);
    }
  }

  override setLogLevels(levels: (LogLevel | ConsoleLogLevel)[]): void {
    const consoleLevels: ConsoleLogLevel[] = levels.map(
      (level): ConsoleLogLevel => (level === 'info' ? 'log' : (level as ConsoleLogLevel)),
    );
    super.setLogLevels(consoleLevels);
  }
}
