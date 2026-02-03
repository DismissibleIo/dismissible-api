<p align="center">
  <a href="https://dismissible.io" target="_blank"><img src="https://raw.githubusercontent.com/DismissibleIo/dismissible-api/main/docs/images/dismissible_logo.png" width="120" alt="Dismissible" /></a>
</p>

<p align="center">Never Show The Same Thing Twice!</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-redis-cache" target="_blank"><img src="https://img.shields.io/npm/v/@dismissible/nestjs-redis-cache.svg" alt="NPM Version" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@dismissible/nestjs-redis-cache.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-redis-cache" target="_blank"><img src="https://img.shields.io/npm/dm/@dismissible/nestjs-redis-cache.svg" alt="NPM Downloads" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api" target="_blank"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/dismissibleio/dismissible-api/release.yml"></a>
  <a href="https://paypal.me/joshstuartx" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
</p>

Dismissible manages the state of your UI elements across sessions, so your users see what matters, once! No more onboarding messages reappearing on every tab, no more notifications haunting users across devices. Dismissible syncs dismissal state everywhere, so every message is intentional, never repetitive.

# @dismissible/nestjs-redis-cache

Redis cache adapter for the Dismissible system.

## Overview

This library provides:

- `RedisCacheAdapter` - Redis-backed cache implementation using `ioredis`
- Distributed caching for the Dismissible system
- Suitable for multi-instance deployments

## Installation

```bash
npm install @dismissible/nestjs-redis-cache
```

## Getting Started

### Using Redis Cache

The Redis cache adapter is useful for production deployments with multiple instances:

```typescript
import { Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-core';
import { RedisCacheModule } from '@dismissible/nestjs-redis-cache';

@Module({
  imports: [
    DismissibleModule.forRoot({
      cache: RedisCacheModule.forRoot({
        url: 'redis://localhost:6379',
        keyPrefix: 'dismissible:cache:',
        ttlMs: 6 * 60 * 60 * 1000, // 6 hours
      }),
    }),
  ],
})
export class AppModule {}
```

### Configuration Options

- `url` (required): Redis connection URL (e.g., `redis://localhost:6379` or `redis://:password@host:port`)
- `keyPrefix` (optional): Key prefix for cache keys (default: 'dismissible:cache:')
- `ttlMs` (optional): Time-to-live in milliseconds (default: 6 hours)
- `enableReadyCheck` (optional): Enable ready check (default: true)
- `maxRetriesPerRequest` (optional): Maximum retries per request (default: 3)
- `connectionTimeoutMs` (optional): Connection timeout in milliseconds

## API Reference

### RedisCacheAdapter

A Redis implementation of `IDismissibleCache` using `ioredis`. Data is stored in Redis and persists across application restarts.

**Note:** This adapter is suitable for distributed systems and production deployments. For single-instance deployments, consider using `@dismissible/nestjs-memory-cache`.

### RedisCacheModule

#### `RedisCacheModule.forRoot(options)`

Register the Redis cache adapter with configuration options.

#### `RedisCacheModule.forRootAsync(options)`

Register the Redis cache adapter with async configuration.

## License

MIT
