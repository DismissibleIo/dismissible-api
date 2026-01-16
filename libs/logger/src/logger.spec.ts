import { ConsoleLogger } from '@nestjs/common';
import { Logger } from './logger';

describe('Logger', () => {
  it('should extend ConsoleLogger', () => {
    const logger = new Logger();
    expect(logger).toBeInstanceOf(ConsoleLogger);
  });

  it('should be an instance of Logger', () => {
    const logger = new Logger();
    expect(logger).toBeInstanceOf(Logger);
  });
});
