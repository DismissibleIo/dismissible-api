# @dismissible/nestjs-logger

A flexible logging module for NestJS applications in the Dismissible ecosystem.

> **Part of the Dismissible API** - This library is part of the [Dismissible API](https://dismissible.io) ecosystem. Visit [dismissible.io](https://dismissible.io) for more information and documentation.

## Overview

This library provides a standardized logging interface (`IDismissibleLogger`) and a default console logger implementation. It's designed to be easily replaceable with custom logging implementations (e.g., Winston, Pino, etc.) while maintaining a consistent API across the Dismissible ecosystem.

## Installation

```bash
npm install @dismissible/nestjs-logger
```

## Getting Started

### Basic Usage

The simplest way to use the logger is with the default console logger:

```typescript
import { Module } from '@nestjs/common';
import { LoggerModule } from '@dismissible/nestjs-logger';

@Module({
  imports: [
    LoggerModule.forRoot({
      // Uses default ConsoleLogger if not specified
    }),
  ],
})
export class AppModule {}
```

### Using the Logger in Your Services

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';

@Injectable()
export class MyService {
  constructor(@Inject(DISMISSIBLE_LOGGER) private readonly logger: IDismissibleLogger) {}

  doSomething() {
    this.logger.debug('Debug message', { context: 'MyService' });
    this.logger.info('Info message', { userId: 'user-123' });
    this.logger.warn('Warning message', { itemId: 'item-456' });
    this.logger.error('Error message', new Error('Something went wrong'), {
      additionalContext: 'value',
    });
  }
}
```

### Custom Logger Implementation

You can provide your own logger implementation:

```typescript
import { Module } from '@nestjs/common';
import { LoggerModule, IDismissibleLogger } from '@dismissible/nestjs-logger';
import * as winston from 'winston';

class WinstonLogger implements IDismissibleLogger {
  private logger = winston.createLogger({
    // Your Winston configuration
  });

  debug(message: string, context?: object): void {
    this.logger.debug(message, context);
  }

  info(message: string, context?: object): void {
    this.logger.info(message, context);
  }

  warn(message: string, context?: object): void {
    this.logger.warn(message, context);
  }

  error(message: string, error?: Error, context?: object): void {
    this.logger.error(message, { error, ...context });
  }
}

@Module({
  imports: [
    LoggerModule.forRoot({
      logger: WinstonLogger,
    }),
  ],
})
export class AppModule {}
```

## API Reference

### IDismissibleLogger Interface

```typescript
interface IDismissibleLogger {
  debug(message: string, context?: object): void;
  info(message: string, context?: object): void;
  warn(message: string, context?: object): void;
  error(message: string, error?: Error, context?: object): void;
}
```

### LoggerModule

#### `LoggerModule.forRoot(options)`

Configures the logger module with the provided options.

**Options:**

- `logger?: Type<IDismissibleLogger>` - Custom logger class (defaults to `Logger`)

**Returns:** `DynamicModule`

## Global Module

The `LoggerModule` is registered as a global module, so you only need to import it once in your root module. The logger will be available throughout your application via dependency injection.

## Related Packages

This logger is used by other Dismissible packages:

- `@dismissible/nestjs-dismissible` - Main dismissible service
- `@dismissible/nestjs-storage` - Storage adapters
- `@dismissible/nestjs-postgres-storage` - PostgreSQL storage adapter

## License

MIT
