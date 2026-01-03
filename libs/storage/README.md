<p align="center">
  <a href="https://dismissible.io" target="_blank"><img src="../../docs/images/dismissible_logo.png" width="120" alt="Dismissible" /></a>
</p>

<p align="center">Never Show The Same Thing Twice!</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-storage" target="_blank"><img src="https://img.shields.io/npm/v/@dismissible/nestjs-storage.svg" alt="NPM Version" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@dismissible/nestjs-storage.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-storage" target="_blank"><img src="https://img.shields.io/npm/dm/@dismissible/nestjs-storage.svg" alt="NPM Downloads" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api" target="_blank"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/dismissibleio/dismissible-api/release.yml"></a>
  <a href="https://paypal.me/joshstuartx" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
</p>

Dismissible manages the state of your UI elements across sessions, so your users see what matters, once! No more onboarding messages reappearing on every tab, no more notifications haunting users across devices. Dismissible syncs dismissal state everywhere, so every message is intentional, never repetitive.

# @dismissible/nestjs-storage

Storage interface and memory adapter for the Dismissible system.

> **Part of the Dismissible API** - This library is part of the [Dismissible API](https://dismissible.io) ecosystem. Visit [dismissible.io](https://dismissible.io) for more information and documentation.

## Overview

This library provides:

- `IDismissibleStorage` - Interface that all storage adapters must implement
- `MemoryStorageAdapter` - In-memory storage implementation (useful for development and testing)
- Storage abstraction layer for the Dismissible system

## Installation

```bash
npm install @dismissible/nestjs-storage
```

## Getting Started

### Using In-Memory Storage

The memory storage adapter is useful for development, testing, or when you don't need persistence:

```typescript
import { Module } from '@nestjs/common';
import { StorageModule, MemoryStorageAdapter } from '@dismissible/nestjs-storage';
import { LoggerModule } from '@dismissible/nestjs-logger';
import { DismissibleItemModule } from '@dismissible/nestjs-item';

@Module({
  imports: [
    LoggerModule.forRoot({}),
    DismissibleItemModule,
    StorageModule.forRoot({
      adapter: MemoryStorageAdapter,
    }),
  ],
})
export class AppModule {}
```

### Implementing a Custom Storage Adapter

You can implement your own storage adapter by implementing the `IDismissibleStorage` interface:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { IDismissibleStorage, DISMISSIBLE_STORAGE_ADAPTER } from '@dismissible/nestjs-storage';
import { DismissibleItemDto } from '@dismissible/nestjs-item';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';

@Injectable()
export class MyCustomStorageAdapter implements IDismissibleStorage {
  constructor(@Inject(DISMISSIBLE_LOGGER) private readonly logger: IDismissibleLogger) {}

  async get(userId: string, itemId: string): Promise<DismissibleItemDto | null> {
    // Your implementation
    this.logger.debug('Getting item', { userId, itemId });
    // ...
  }

  async create(item: DismissibleItemDto): Promise<DismissibleItemDto> {
    // Your implementation
    this.logger.debug('Creating item', { itemId: item.id });
    // ...
  }

  async update(item: DismissibleItemDto): Promise<DismissibleItemDto> {
    // Your implementation
    this.logger.debug('Updating item', { itemId: item.id });
    // ...
  }

  async delete(userId: string, itemId: string): Promise<void> {
    // Your implementation
    this.logger.debug('Deleting item', { userId, itemId });
    // ...
  }

  async deleteAll(): Promise<void> {
    // Your implementation
    this.logger.debug('Deleting all items');
    // ...
  }
}

// Register your adapter
@Module({
  providers: [
    MyCustomStorageAdapter,
    {
      provide: DISMISSIBLE_STORAGE_ADAPTER,
      useExisting: MyCustomStorageAdapter,
    },
  ],
  exports: [DISMISSIBLE_STORAGE_ADAPTER],
})
export class MyStorageModule {}
```

## API Reference

### IDismissibleStorage Interface

```typescript
interface IDismissibleStorage {
  get(userId: string, itemId: string): Promise<DismissibleItemDto | null>;
  create(item: DismissibleItemDto): Promise<DismissibleItemDto>;
  update(item: DismissibleItemDto): Promise<DismissibleItemDto>;
  delete(userId: string, itemId: string): Promise<void>;
  deleteAll(): Promise<void>;
}
```

### MemoryStorageAdapter

An in memory implementation of `IDismissibleStorage`. Data is stored in a `Map` and will be lost when the application restarts.

**Note:** This adapter is suitable for development and testing only. For production use, consider using `@dismissible/nestjs-postgres-storage` or implementing your own persistent storage adapter.

### StorageModule

#### `StorageModule.forRoot(options)`

Configures the storage module with the provided adapter.

**Options:**

- `adapter: Type<IDismissibleStorage>` - The storage adapter class to use

**Returns:** `DynamicModule`

## Injection Token

The storage adapter is provided via the `DISMISSIBLE_STORAGE_ADAPTER` injection token:

```typescript
import { Inject } from '@nestjs/common';
import { DISMISSIBLE_STORAGE_ADAPTER, IDismissibleStorage } from '@dismissible/nestjs-storage';

@Injectable()
export class MyService {
  constructor(
    @Inject(DISMISSIBLE_STORAGE_ADAPTER)
    private readonly storage: IDismissibleStorage,
  ) {}
}
```

## Related Packages

- `@dismissible/nestjs-core` - Main dismissible service (uses storage adapters)
- `@dismissible/nestjs-postgres-storage` - PostgreSQL storage adapter implementation
- `@dismissible/nestjs-item` - Data models used by storage adapters
- `@dismissible/nestjs-logger` - Logging used by storage adapters

## License

MIT
