# @dismissible/nestjs-storage

Storage interface and in-memory adapter for the Dismissible system.

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

The in-memory storage adapter is useful for development, testing, or when you don't need persistence:

```typescript
import { Module } from '@nestjs/common';
import { StorageModule, MemoryStorageAdapter } from '@dismissible/nestjs-storage';
import { LoggerModule } from '@dismissible/nestjs-logger';
import { DismissibleItemModule } from '@dismissible/nestjs-dismissible-item';

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
import { Injectable } from '@nestjs/common';
import { IDismissibleStorage, DISMISSIBLE_STORAGE_ADAPTER } from '@dismissible/nestjs-storage';
import { DismissibleItemDto } from '@dismissible/nestjs-dismissible-item';
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
}
```

### MemoryStorageAdapter

An in-memory implementation of `IDismissibleStorage`. Data is stored in a `Map` and will be lost when the application restarts.

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

- `@dismissible/nestjs-dismissible` - Main dismissible service (uses storage adapters)
- `@dismissible/nestjs-postgres-storage` - PostgreSQL storage adapter implementation
- `@dismissible/nestjs-dismissible-item` - Data models used by storage adapters
- `@dismissible/nestjs-logger` - Logging used by storage adapters

## License

MIT
