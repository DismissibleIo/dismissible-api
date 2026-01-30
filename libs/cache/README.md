<p align="center">
  <a href="https://dismissible.io" target="_blank"><img src="https://raw.githubusercontent.com/DismissibleIo/dismissible-api/main/docs/images/dismissible_logo.png" width="120" alt="Dismissible" /></a>
</p>

<p align="center">Never Show The Same Thing Twice!</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-cache" target="_blank"><img src="https://img.shields.io/npm/v/@dismissible/nestjs-cache.svg" alt="NPM Version" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@dismissible/nestjs-cache.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-cache" target="_blank"><img src="https://img.shields.io/npm/dm/@dismissible/nestjs-cache.svg" alt="NPM Downloads" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api" target="_blank"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/dismissibleio/dismissible-api/release.yml"></a>
  <a href="https://paypal.me/joshstuartx" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
</p>

Dismissible manages the state of your UI elements across sessions, so your users see what matters, once! No more onboarding messages reappearing on every tab, no more notifications haunting users across devices. Dismissible syncs dismissal state everywhere, so every message is intentional, never repetitive.

# @dismissible/nestjs-cache

Cache interface and null adapter for the Dismissible system.

## Overview

This library provides:

- `IDismissibleCache` - Interface that all cache adapters must implement
- `NullCacheAdapter` - No-op cache implementation (used when caching is disabled)
- Cache abstraction layer for the Dismissible system

## Installation

```bash
npm install @dismissible/nestjs-cache
```

## Getting Started

### Using Null Cache (Default)

The null cache adapter is used by default when no cache is configured. It performs no operations and is useful when caching is not needed:

```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@dismissible/nestjs-cache';
import { DismissibleModule } from '@dismissible/nestjs-core';

@Module({
  imports: [
    DismissibleModule.forRoot({
      cache: CacheModule, // Uses NullCacheAdapter by default
    }),
  ],
})
export class AppModule {}
```

### Implementing a Custom Cache Adapter

You can implement your own cache adapter by implementing the `IDismissibleCache` interface:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { IDismissibleCache, DISMISSIBLE_CACHE_ADAPTER } from '@dismissible/nestjs-cache';
import { DismissibleItemDto } from '@dismissible/nestjs-item';

@Injectable()
export class MyCustomCacheAdapter implements IDismissibleCache {
  async get(userId: string, itemId: string): Promise<DismissibleItemDto | null> {
    // Your implementation
    // ...
  }

  async getMany(userId: string, itemIds: string[]): Promise<Map<string, DismissibleItemDto>> {
    // Your implementation
    // ...
  }

  async set(item: DismissibleItemDto): Promise<void> {
    // Your implementation
    // ...
  }

  async setMany(items: DismissibleItemDto[]): Promise<void> {
    // Your implementation
    // ...
  }

  async delete(userId: string, itemId: string): Promise<void> {
    // Your implementation
    // ...
  }

  async deleteMany(userId: string, itemIds: string[]): Promise<void> {
    // Your implementation
    // ...
  }
}

// Register your adapter
@Module({
  providers: [
    MyCustomCacheAdapter,
    {
      provide: DISMISSIBLE_CACHE_ADAPTER,
      useExisting: MyCustomCacheAdapter,
    },
  ],
  exports: [DISMISSIBLE_CACHE_ADAPTER],
})
export class MyCacheModule {}
```

## API Reference

### IDismissibleCache Interface

```typescript
interface IDismissibleCache {
  get(userId: string, itemId: string): Promise<DismissibleItemDto | null>;
  getMany(userId: string, itemIds: string[]): Promise<Map<string, DismissibleItemDto>>;
  set(item: DismissibleItemDto): Promise<void>;
  setMany(items: DismissibleItemDto[]): Promise<void>;
  delete(userId: string, itemId: string): Promise<void>;
  deleteMany(userId: string, itemIds: string[]): Promise<void>;
}
```

### NullCacheAdapter

A no-op implementation of `IDismissibleCache`. All methods return empty/null values or perform no operations. This adapter is used by default when no cache is configured.

**Note:** This adapter is suitable when caching is not needed. For production use with caching, consider using `@dismissible/nestjs-memory-cache` or `@dismissible/nestjs-redis-cache`.

### CacheModule

#### `CacheModule`

The base cache module that provides `NullCacheAdapter` by default. When used in `DismissibleModule.forRoot()`, it enables optional caching support.

## License

MIT
