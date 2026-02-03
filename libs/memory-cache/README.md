<p align="center">
  <a href="https://dismissible.io" target="_blank"><img src="https://raw.githubusercontent.com/DismissibleIo/dismissible-api/main/docs/images/dismissible_logo.png" width="120" alt="Dismissible" /></a>
</p>

<p align="center">Never Show The Same Thing Twice!</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-memory-cache" target="_blank"><img src="https://img.shields.io/npm/v/@dismissible/nestjs-memory-cache.svg" alt="NPM Version" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@dismissible/nestjs-memory-cache.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-memory-cache" target="_blank"><img src="https://img.shields.io/npm/dm/@dismissible/nestjs-memory-cache.svg" alt="NPM Downloads" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api" target="_blank"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/dismissibleio/dismissible-api/release.yml"></a>
  <a href="https://paypal.me/joshstuartx" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
</p>

Dismissible manages the state of your UI elements across sessions, so your users see what matters, once! No more onboarding messages reappearing on every tab, no more notifications haunting users across devices. Dismissible syncs dismissal state everywhere, so every message is intentional, never repetitive.

# @dismissible/nestjs-memory-cache

In-memory LRU cache adapter for the Dismissible system.

## Overview

This library provides:

- `MemoryCacheAdapter` - In-memory LRU cache implementation using `lru-cache`
- Cache adapter for the Dismissible system with automatic eviction

## Installation

```bash
npm install @dismissible/nestjs-memory-cache
```

## Getting Started

### Using In-Memory Cache

The memory cache adapter is useful for development, testing, or single-instance production deployments:

```typescript
import { Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-core';
import { MemoryCacheModule } from '@dismissible/nestjs-memory-cache';

@Module({
  imports: [
    DismissibleModule.forRoot({
      cache: MemoryCacheModule.forRoot({
        maxItems: 5000,
        ttlMs: 6 * 60 * 60 * 1000, // 6 hours
      }),
    }),
  ],
})
export class AppModule {}
```

### Configuration Options

- `maxItems` (optional): Maximum number of items to cache (default: 5000)
- `ttlMs` (optional): Time-to-live in milliseconds (default: 6 hours)

## API Reference

### MemoryCacheAdapter

An in-memory implementation of `IDismissibleCache` using LRU (Least Recently Used) eviction. Data is stored in memory and will be lost when the application restarts.

**Note:** This adapter is suitable for single-instance deployments. For distributed systems, consider using `@dismissible/nestjs-redis-cache`.

### MemoryCacheModule

#### `MemoryCacheModule.forRoot(options)`

Register the memory cache adapter with configuration options.

#### `MemoryCacheModule.forRootAsync(options)`

Register the memory cache adapter with async configuration.

## License

MIT
