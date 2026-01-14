<p align="center">
  <a href="https://dismissible.io" target="_blank"><img src="https://raw.githubusercontent.com/DismissibleIo/dismissible-api/main/docs/images/dismissible_logo.png" width="120" alt="Dismissible" /></a>
</p>

<p align="center">Never Show The Same Thing Twice!</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-logger" target="_blank"><img src="https://img.shields.io/npm/v/@dismissible/nestjs-logger.svg" alt="NPM Version" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@dismissible/nestjs-logger.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-logger" target="_blank"><img src="https://img.shields.io/npm/dm/@dismissible/nestjs-logger.svg" alt="NPM Downloads" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api" target="_blank"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/dismissibleio/dismissible-api/release.yml"></a>
  <a href="https://paypal.me/joshstuartx" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
</p>

Dismissible manages the state of your UI elements across sessions, so your users see what matters, once! No more onboarding messages reappearing on every tab, no more notifications haunting users across devices. Dismissible syncs dismissal state everywhere, so every message is intentional, never repetitive.

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
    this.logger.log('Log message', { userId: 'user-123' });
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

  log(message: string, ...optionalParams: any[]): void {
    this.logger.log(message, ...optionalParams);
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
  debug(message: string, ...optionalParams: any[]): void;
  log(message: string, ...optionalParams: any[]): void;
  warn(message: string, ...optionalParams: any[]): void;
  error(message: string, ...optionalParams: any[]): void;
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

- `@dismissible/nestjs-core` - Main dismissible service
- `@dismissible/nestjs-storage` - Storage adapters
- `@dismissible/nestjs-postgres-storage` - PostgreSQL storage adapter

## License

MIT
