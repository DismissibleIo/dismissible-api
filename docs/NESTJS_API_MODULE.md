# Dismissible API - NestJS Module

> **Integrate dismissible state management directly into your NestJS application**

The `@dismissible/nestjs-api` package provides a complete NestJS module for managing dismissible UI elements. It includes built-in REST endpoints, lifecycle hooks, event emission, and flexible storage options.

**Visit [dismissible.io](https://dismissible.io)** for full documentation, help, and support.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Module Configuration](#module-configuration)
- [Built-in REST API](#built-in-rest-api)
- [Using the Service Directly](#using-the-service-directly)
- [Storage Options](#storage-options)
  - [In-Memory Storage](#memory-storage-default)
  - [PostgreSQL Storage](#postgresql-storage)
  - [Custom Storage Adapter](#custom-storage-adapter)
- [JWT Authentication](#jwt-authentication)
- [Rate Limiting](#rate-limiting)
- [Lifecycle Hooks](#lifecycle-hooks)
  - [Creating a Hook](#creating-a-hook)
  - [Hook Methods](#hook-methods)
  - [Batch Hook Methods](#batch-hook-methods)
  - [Hook Priority](#hook-priority)
  - [Blocking Operations](#blocking-operations)
  - [Mutating Parameters](#mutating-parameters)
- [Events](#events)
  - [Available Events](#available-events)
  - [Listening to Events](#listening-to-events)
- [Custom Logger](#custom-logger)
- [React Client Integration](#react-client-integration)
- [API Reference](#api-reference)

## Installation

```bash
npm install @dismissible/nestjs-api
```

## Quick Start

Import the `DismissibleModule` into your NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-api';

@Module({
  imports: [
    DismissibleModule.forRoot({
      // Uses memory storage by default
    }),
  ],
})
export class AppModule {}
```

That's it! Your application now has REST endpoints for managing dismissible items.

## Choosing Between Factory and Module

The `@dismissible/nestjs-api` package provides two integration approaches: **`DismissibleNestFactory`** (factory pattern) and **`DismissibleModule.forRoot()`** (module pattern). Choose based on your application architecture:

### Use DismissibleNestFactory.create() When

- **Building a standalone dismissible API service** - You want a dedicated microservice for managing dismissible items
- **Want batteries-included setup** - Get Swagger, Helmet, CORS, health checks, and configuration out-of-the-box
- **Need quick deployment** - Minimal configuration required to get started
- **Following the example apps** - Matches the structure of the reference implementations

```typescript
import { DismissibleNestFactory } from '@dismissible/nestjs-api';

async function bootstrap() {
  const app = await DismissibleNestFactory.create({
    configPath: './config',
    hooks: [AuditHook],
  });
  await app.start();
}

bootstrap();
```

The factory automatically configures:

- Swagger API documentation at `/api`
- Security headers (Helmet)
- CORS configuration
- Health check endpoint at `/health`
- Graceful shutdown handling
- YAML-based configuration loading

### Use DismissibleModule.forRoot() When

- **Integrating into an existing NestJS application** - You already have a NestJS app and want to add dismissible functionality
- **Already have infrastructure configured** - Your app already has Swagger, security, health checks, etc.
- **Need fine-grained control** - You want to control middleware, guards, interceptors, and routing yourself
- **Building a larger application** - Dismissible is one feature among many in your application

```typescript
import { Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-api';

@Module({
  imports: [
    DismissibleModule.forRoot({
      hooks: [AuditHook],
      storage: PostgresStorageModule,
    }),
  ],
})
export class AppModule {}
```

The module integrates cleanly with your existing NestJS infrastructure.

### Comparison Table

| Feature                   | DismissibleNestFactory      | DismissibleModule.forRoot() |
| ------------------------- | --------------------------- | --------------------------- |
| **Setup Complexity**      | Low - turnkey solution      | Medium - manual config      |
| **Swagger API Docs**      | Automatic at `/api`         | Manual setup                |
| **Security (Helmet)**     | Automatic                   | Manual setup                |
| **CORS Configuration**    | Automatic from config       | Manual setup                |
| **Health Checks**         | Automatic at `/health`      | Manual setup                |
| **Configuration Loading** | Built-in YAML loader        | Manual or use your own      |
| **Graceful Shutdown**     | Automatic                   | Manual setup                |
| **Use Case**              | Standalone API service      | Integrated feature          |
| **Control Level**         | Opinionated defaults        | Full customization          |
| **Best For**              | New projects, microservices | Existing apps, monoliths    |

> **Tip**: Start with `DismissibleNestFactory` for rapid prototyping, then migrate to `DismissibleModule.forRoot()` if you need more control or are integrating into a larger application.

## Module Configuration

The `DismissibleModule.forRoot()` method accepts a configuration object with the following options:

```typescript
import { DismissibleModule } from '@dismissible/nestjs-api';
import { PostgresStorageModule } from '@dismissible/nestjs-postgres-storage';
import { HttpModule } from '@nestjs/axios';
import { AuditHook, AnalyticsHook } from './hooks';
import { CustomLogger } from './logger';
import { AnalyticsService } from './services';
import { CustomDismissibleController } from './controllers';

@Module({
  imports: [
    DismissibleModule.forRoot({
      // Storage adapter (optional, defaults to memory)
      storage: PostgresStorageModule,

      // Custom logger implementation (optional)
      logger: CustomLogger,

      // Lifecycle hooks (optional)
      hooks: [AuditHook, AnalyticsHook],

      // Additional NestJS modules (optional)
      imports: [HttpModule.register({ timeout: 5000 })],

      // Additional providers (optional)
      providers: [AnalyticsService],

      // Custom controllers - replaces built-in REST API (optional)
      // controllers: [CustomDismissibleController],
    }),
  ],
})
export class AppModule {}
```

### Configuration Options

| Option        | Type                                   | Default           | Description                                                 |
| ------------- | -------------------------------------- | ----------------- | ----------------------------------------------------------- |
| `storage`     | `DynamicModule \| Type<any>`           | In-memory storage | Storage module for persisting dismissible items             |
| `logger`      | `Type<IDismissibleLogger>`             | Console logger    | Custom logger implementation                                |
| `hooks`       | `Type<IDismissibleLifecycleHook<T>>[]` | `[]`              | Array of lifecycle hook classes                             |
| `imports`     | `DynamicModule[]`                      | `[]`              | Additional NestJS dynamic modules to import                 |
| `providers`   | `Provider[]`                           | `[]`              | Additional providers to register in the module              |
| `controllers` | `Type<any>[]`                          | Default REST API  | Custom controllers (replaces built-in REST API if provided) |

### Programmatic Configuration Override

While storage and cache types are typically configured via environment variables (see [Configuration Guide](./CONFIGURATION.md)), you can override them programmatically when using `DismissibleNestFactory`:

```typescript
import { DismissibleNestFactory } from '@dismissible/nestjs-api';
import { StorageType } from '@dismissible/nestjs-api';

async function bootstrap() {
  const app = await DismissibleNestFactory.create({
    configPath: './config',

    // Override storage type (bypasses DISMISSIBLE_STORAGE_TYPE env var)
    storage: StorageType.POSTGRES,

    // Override cache type (bypasses DISMISSIBLE_CACHE_TYPE env var)
    cache: CacheType.REDIS,

    hooks: [AuditHook],
  });

  await app.start();
}

bootstrap();
```

Available storage types:

- `StorageType.MEMORY` - In-memory LRU cache (default)
- `StorageType.POSTGRES` - PostgreSQL database
- `StorageType.DYNAMODB` - Amazon DynamoDB

Available cache types:

- `CacheType.MEMORY` - In-memory cache (default)
- `CacheType.REDIS` - Redis cache

When using `DismissibleModule.forRoot()` directly, pass the storage module explicitly:

```typescript
import { DismissibleModule } from '@dismissible/nestjs-api';
import { PostgresStorageModule } from '@dismissible/nestjs-postgres-storage';
import { RedisCacheModule } from '@dismissible/nestjs-redis-cache';

@Module({
  imports: [
    DismissibleModule.forRoot({
      // Direct module reference (bypasses env vars)
      storage: PostgresStorageModule,
      cache: RedisCacheModule,
      hooks: [AuditHook],
    }),
  ],
})
export class AppModule {}
```

> **Note**: Programmatic overrides take precedence over environment variables. This is useful for testing different storage backends or when you need dynamic configuration based on runtime conditions.

### Adding Custom Imports

Use the `imports` option to add additional NestJS modules that your hooks or custom logic depend on:

```typescript
import { DismissibleModule } from '@dismissible/nestjs-api';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    DismissibleModule.forRoot({
      imports: [HttpModule.register({ timeout: 5000 }), CacheModule.register({ ttl: 300 })],
      hooks: [WebhookNotificationHook], // Can now inject HttpService
    }),
  ],
})
export class AppModule {}
```

### Adding Custom Providers

Use the `providers` option to register additional services that your hooks or controllers can inject:

```typescript
import { DismissibleModule } from '@dismissible/nestjs-api';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    DismissibleModule.forRoot({
      providers: [AnalyticsService],
      hooks: [AnalyticsHook], // Can inject AnalyticsService
    }),
  ],
})
export class AppModule {}
```

### Custom Controllers

Use the `controllers` option to replace the built-in REST API with your own controllers:

```typescript
import { DismissibleModule } from '@dismissible/nestjs-api';
import { CustomDismissibleController } from './custom-dismissible.controller';

@Module({
  imports: [
    DismissibleModule.forRoot({
      controllers: [CustomDismissibleController],
    }),
  ],
})
export class AppModule {}
```

> **Note**: When you provide custom controllers, the built-in REST API endpoints are replaced entirely. Your custom controllers can inject `DismissibleService` to interact with the dismissible system.

## Built-in REST API

The module automatically registers REST endpoints for all operations:

| Endpoint                          | Method   | Description                                 |
| --------------------------------- | -------- | ------------------------------------------- |
| `/v1/users/:userId/items/:itemId` | `GET`    | Get or create a dismissible item            |
| `/v1/users/:userId/items/:itemId` | `DELETE` | Dismiss an item (marks as dismissed)        |
| `/v1/users/:userId/items/:itemId` | `POST`   | Restore a previously dismissed item         |
| `/v1/users/:userId/items`         | `POST`   | Batch get or create multiple items (max 50) |

### Example Requests

```bash
# Get or create an item
curl "http://localhost:3001/v1/users/user-123/items/welcome-banner"

# Dismiss an item
curl -X DELETE "http://localhost:3001/v1/users/user-123/items/welcome-banner"

# Restore a dismissed item
curl -X POST "http://localhost:3001/v1/users/user-123/items/welcome-banner"

# Batch get or create multiple items
curl -X POST "http://localhost:3001/v1/users/user-123/items" \
  -H "Content-Type: application/json" \
  -d '{"items": ["welcome-banner", "onboarding-tip-1", "feature-announcement"]}'
```

### Response Format

All endpoints return a consistent response format:

```json
{
  "success": true,
  "data": {
    "item": {
      "id": "welcome-banner",
      "userId": "user-123",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "dismissedAt": null
    },
    "created": true
  }
}
```

### Batch Response Format

The batch endpoint returns an array of items:

```json
{
  "data": [
    {
      "id": "welcome-banner",
      "userId": "user-123",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "dismissedAt": null
    },
    {
      "id": "onboarding-tip-1",
      "userId": "user-123",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "dismissedAt": "2024-01-16T14:20:00.000Z"
    },
    {
      "id": "feature-announcement",
      "userId": "user-123",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "dismissedAt": null
    }
  ]
}
```

## Using the Service Directly

Instead of using the built-in REST endpoints, you can inject `DismissibleService` into your controllers or services:

```typescript
import { Controller, Get, Param, Delete, Post, Query } from '@nestjs/common';
import { DismissibleService } from '@dismissible/nestjs-api';

@Controller('features')
export class FeaturesController {
  constructor(private readonly dismissibleService: DismissibleService) {}

  @Get(':userId/banners/:bannerId')
  async getBanner(
    @Param('userId') userId: string,
    @Param('bannerId') bannerId: string,
    @Query('version') version?: string,
  ) {
    const result = await this.dismissibleService.getOrCreate(bannerId, userId);

    return {
      banner: result.item,
      isNew: result.created,
      shouldShow: !result.item.dismissedAt,
    };
  }

  @Delete(':userId/banners/:bannerId')
  async dismissBanner(@Param('userId') userId: string, @Param('bannerId') bannerId: string) {
    const result = await this.dismissibleService.dismiss(bannerId, userId);
    return { dismissed: true, item: result.item };
  }

  @Post(':userId/banners/:bannerId/restore')
  async restoreBanner(@Param('userId') userId: string, @Param('bannerId') bannerId: string) {
    const result = await this.dismissibleService.restore(bannerId, userId);
    return { restored: true, item: result.item };
  }
}
```

## Storage Options

### In-Memory Storage (Default)

The default storage adapter keeps items in memory using an LRU (Least Recently Used) cache. Data is lost on application restart. This is ideal for development and testing.

```typescript
DismissibleModule.forRoot({
  // No storage option = memory storage
});
```

#### Configuration

| Property   | Description                                     | Default    |
| ---------- | ----------------------------------------------- | ---------- |
| `maxItems` | Maximum number of items to store (LRU eviction) | `5000`     |
| `ttlMs`    | Time-to-live in milliseconds                    | `21600000` |

#### Environment Variables

| Variable                               | Description                      | Default    |
| -------------------------------------- | -------------------------------- | ---------- |
| `DISMISSIBLE_STORAGE_MEMORY_MAX_ITEMS` | Maximum number of items to store | `5000`     |
| `DISMISSIBLE_STORAGE_MEMORY_TTL_MS`    | Time-to-live in milliseconds     | `21600000` |

#### YAML Configuration

```yaml
storage:
  type: memory
  memory:
    maxItems: ${DISMISSIBLE_STORAGE_MEMORY_MAX_ITEMS:-5000}
    ttlMs: ${DISMISSIBLE_STORAGE_MEMORY_TTL_MS:-21600000}
```

> **Warning**: Do not use the memory adapter in production. Data will be lost on restart and is not shared across multiple instances.

### PostgreSQL Storage

For production use, persist items in a PostgreSQL database:

```bash
npm install @dismissible/nestjs-postgres-storage
```

**IMPORTANT**: Before using PostgreSQL storage, you must:

1. Set up your PostgreSQL database
2. Configure the connection string
3. **Initialize the database schema** (see [Database Schema Initialization](#database-schema-initialization) below)

```typescript
import { DismissibleModule } from '@dismissible/nestjs-api';
import { PostgresStorageModule } from '@dismissible/nestjs-postgres-storage';

@Module({
  imports: [
    DismissibleModule.forRoot({
      storage: PostgresStorageModule,
    }),
  ],
})
export class AppModule {}
```

Configure the database connection via environment variable:

```env
DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING=postgresql://user:password@localhost:5432/dismissible
```

### Database Schema Initialization

**CRITICAL**: You must initialize the database schema before starting your application. The storage adapter will fail if the database tables don't exist.

#### Step 1: Generate Prisma Client

First, generate the Prisma Client based on the schema:

```bash
# Using the CLI helper (recommended)
npx dismissible-prisma generate

# Or using Prisma directly
npx prisma generate --schema=node_modules/@dismissible/nestjs-postgres-storage/prisma/schema.prisma
```

#### Step 2: Initialize the Database Schema

Choose the appropriate method based on your environment:

**For Development (First Time Setup):**

```bash
# Create and apply initial migration
npx dismissible-prisma migrate dev --name init

# Or using Prisma directly
npx prisma migrate dev --schema=node_modules/@dismissible/nestjs-postgres-storage/prisma/schema.prisma --name init
```

This creates migration files in `node_modules/@dismissible/nestjs-postgres-storage/prisma/migrations/` and applies them to your database.

**For Production or Applying Existing Migrations:**

```bash
# Apply all pending migrations (idempotent, safe for production)
npx dismissible-prisma migrate deploy

# Or using Prisma directly
npx prisma migrate deploy --schema=node_modules/@dismissible/nestjs-postgres-storage/prisma/schema.prisma
```

**For Quick Development (Not for Production):**

```bash
# Push schema without creating migration files (development only)
npx dismissible-prisma db push
```

> **Warning**: `db push` is for development only. It may cause data loss and doesn't create version-controlled migrations.

#### Step 3: Verify Schema

After running migrations, verify the schema was created:

```bash
# Check that the DismissibleItem table exists
npx dismissible-prisma studio
# Or query directly: SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

#### Migration Commands Reference

| Command          | Use Case                                      | Production Safe?            |
| ---------------- | --------------------------------------------- | --------------------------- |
| `migrate dev`    | Create new migrations during development      | No (creates new migrations) |
| `migrate deploy` | Apply existing migrations (production, CI/CD) | Yes (idempotent)            |
| `db push`        | Quick schema sync (development only)          | No (may cause data loss)    |
| `generate`       | Generate Prisma Client (required before use)  | Yes                         |

> **Important**:
>
> - Always run `generate` before using the storage module
> - Run migrations **before** starting your NestJS application
> - The storage adapter will fail at runtime if tables don't exist
> - Migrations are idempotent - safe to run multiple times

### Custom Storage Adapter

Implement the `IDismissibleStorage` interface to create a custom storage adapter (e.g., Redis, MongoDB):

```typescript
import { Injectable, Module } from '@nestjs/common';
import { IDismissibleStorage, DISMISSIBLE_STORAGE } from '@dismissible/nestjs-storage';
import { DismissibleItemDto } from '@dismissible/nestjs-item';

@Injectable()
export class RedisStorageAdapter implements IDismissibleStorage {
  constructor(private readonly redis: RedisClient) {}

  async get(userId: string, itemId: string): Promise<DismissibleItemDto | null> {
    const key = `dismissible:${userId}:${itemId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async create(userId: string, item: DismissibleItemDto): Promise<void> {
    const key = `dismissible:${userId}:${item.id}`;
    await this.redis.set(key, JSON.stringify(item));
  }

  async update(userId: string, item: DismissibleItemDto): Promise<void> {
    await this.create(userId, item); // Same operation for Redis
  }
}

@Module({
  providers: [
    {
      provide: DISMISSIBLE_STORAGE,
      useClass: RedisStorageAdapter,
    },
  ],
  exports: [DISMISSIBLE_STORAGE],
})
export class RedisStorageModule {}
```

Use your custom storage:

```typescript
DismissibleModule.forRoot({
  storage: RedisStorageModule,
});
```

### Custom Storage Adapter Implementation Requirements

When implementing a custom storage adapter, follow these requirements to ensure correct behavior and consistency with the built-in adapters.

#### Error Handling Requirements

Your storage adapter should throw standard NestJS exceptions to communicate errors:

**NotFoundException** - When an item doesn't exist:

```typescript
import { NotFoundException } from '@nestjs/common';

async get(userId: string, itemId: string): Promise<DismissibleItemDto | null> {
  const item = await this.findItem(userId, itemId);
  if (!item) {
    return null; // Return null, don't throw NotFoundException for get()
  }
  return item;
}

async update(userId: string, item: DismissibleItemDto): Promise<void> {
  const exists = await this.itemExists(userId, item.id);
  if (!exists) {
    throw new NotFoundException(`Item ${item.id} not found for user ${userId}`);
  }
  await this.updateItem(userId, item);
}
```

**BadRequestException** - For invalid input or constraints:

```typescript
import { BadRequestException } from '@nestjs/common';

async create(userId: string, item: DismissibleItemDto): Promise<void> {
  if (!item.id || !userId) {
    throw new BadRequestException('Item ID and User ID are required');
  }

  const exists = await this.itemExists(userId, item.id);
  if (exists) {
    throw new BadRequestException(`Item ${item.id} already exists for user ${userId}`);
  }

  await this.createItem(userId, item);
}
```

**InternalServerErrorException** - For unexpected errors:

```typescript
import { InternalServerErrorException } from '@nestjs/common';

async get(userId: string, itemId: string): Promise<DismissibleItemDto | null> {
  try {
    return await this.findItem(userId, itemId);
  } catch (error) {
    throw new InternalServerErrorException(
      `Failed to retrieve item: ${error.message}`
    );
  }
}
```

#### Concurrency Considerations

Handle concurrent modifications safely:

**Optimistic Locking** - Use version numbers or timestamps:

```typescript
async update(userId: string, item: DismissibleItemDto): Promise<void> {
  // Add version field to your schema
  const current = await this.get(userId, item.id);

  if (!current) {
    throw new NotFoundException(`Item ${item.id} not found`);
  }

  // Check version to detect concurrent modifications
  if (current.version !== item.version) {
    throw new BadRequestException(
      'Item was modified by another process. Please refresh and try again.'
    );
  }

  // Increment version on update
  const updated = {
    ...item,
    version: item.version + 1,
  };

  await this.saveItem(userId, updated);
}
```

**Atomic Operations** - Use database transactions or atomic commands:

```typescript
async update(userId: string, item: DismissibleItemDto): Promise<void> {
  // For SQL databases, use transactions
  await this.database.transaction(async (trx) => {
    const current = await trx.get(userId, item.id);
    if (!current) {
      throw new NotFoundException(`Item not found`);
    }
    await trx.update(userId, item);
  });

  // For Redis, use WATCH/MULTI/EXEC
  await this.redis.watch(this.getKey(userId, item.id));
  await this.redis.multi()
    .set(this.getKey(userId, item.id), JSON.stringify(item))
    .exec();
}
```

**Race Condition Prevention**:

- The `get()` method should be idempotent and safe for concurrent reads
- The `create()` method should fail if the item already exists
- The `update()` method should be atomic - all fields updated together or none
- Consider using database-level constraints (unique indexes, foreign keys)

#### Transaction Semantics

**Atomicity** - Updates must be all-or-nothing:

```typescript
async update(userId: string, item: DismissibleItemDto): Promise<void> {
  // BAD: Updating fields separately (not atomic)
  await this.updateDismissedAt(userId, item.id, item.dismissedAt);
  await this.updateMetadata(userId, item.id, item.metadata);

  // GOOD: Update all fields atomically
  await this.replaceItem(userId, item);
}
```

**Consistency** - Maintain data integrity:

```typescript
async create(userId: string, item: DismissibleItemDto): Promise<void> {
  // Validate all required fields are present
  if (!item.id || !item.userId || !item.createdAt) {
    throw new BadRequestException('Missing required fields');
  }

  // Ensure userId in item matches the parameter
  if (item.userId !== userId) {
    throw new BadRequestException('User ID mismatch');
  }

  await this.saveItem(userId, item);
}
```

**Idempotency** - Safe to retry operations:

```typescript
async create(userId: string, item: DismissibleItemDto): Promise<void> {
  // Create should fail if item already exists (not idempotent by design)
  const exists = await this.itemExists(userId, item.id);
  if (exists) {
    throw new BadRequestException('Item already exists');
  }
  await this.saveItem(userId, item);
}

async update(userId: string, item: DismissibleItemDto): Promise<void> {
  // Update should be idempotent - same result if called multiple times
  await this.replaceItem(userId, item); // Last write wins
}
```

#### TTL and Expiration Handling

If your storage backend supports TTL/expiration:

```typescript
@Injectable()
export class RedisStorageAdapter implements IDismissibleStorage {
  private readonly DEFAULT_TTL = 60 * 60 * 24 * 30; // 30 days in seconds

  async create(userId: string, item: DismissibleItemDto): Promise<void> {
    const key = this.getKey(userId, item.id);
    const ttl = this.calculateTTL(item);

    await this.redis.set(key, JSON.stringify(item), 'EX', ttl);
  }

  async update(userId: string, item: DismissibleItemDto): Promise<void> {
    const key = this.getKey(userId, item.id);
    const exists = await this.redis.exists(key);

    if (!exists) {
      throw new NotFoundException(`Item not found`);
    }

    const ttl = this.calculateTTL(item);

    await this.redis.set(key, JSON.stringify(item), 'EX', ttl);
  }

  private calculateTTL(item: DismissibleItemDto): number {
    // Dismissed items might have shorter TTL
    if (item.dismissedAt) {
      return 60 * 60 * 24 * 7; // 7 days
    }
    return this.DEFAULT_TTL;
  }

  private getKey(userId: string, itemId: string): string {
    return `dismissible:${userId}:${itemId}`;
  }
}
```

**Best Practices for TTL:**

- Set appropriate TTL based on your use case
- Consider different TTL for dismissed vs. active items
- Document TTL behavior for users of your adapter
- Handle expired items gracefully (return `null` from `get()`)

#### Batch Operations (Optional)

For better performance, implement batch operations if your backend supports them:

```typescript
export interface IDismissibleStorage {
  // Standard methods
  get(userId: string, itemId: string): Promise<DismissibleItemDto | null>;
  create(userId: string, item: DismissibleItemDto): Promise<void>;
  update(userId: string, item: DismissibleItemDto): Promise<void>;

  // Optional batch methods
  batchGet?(userId: string, itemIds: string[]): Promise<DismissibleItemDto[]>;
  batchCreate?(userId: string, items: DismissibleItemDto[]): Promise<void>;
}
```

If batch methods are not implemented, the system will fall back to individual operations.

## JWT Authentication

Secure your API endpoints using the optional JWT Auth Hook with any OIDC-compliant identity provider (Auth0, Okta, Keycloak, Azure AD, etc.):

```bash
npm install @dismissible/nestjs-jwt-auth-hook @nestjs/axios axios
```

```typescript
import { Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-api';
import { JwtAuthHookModule, JwtAuthHook } from '@dismissible/nestjs-jwt-auth-hook';

@Module({
  imports: [
    JwtAuthHookModule.forRoot({
      enabled: true,
      wellKnownUrl: 'https://your-tenant.auth0.com/.well-known/openid-configuration',
      issuer: 'https://your-tenant.auth0.com/',
      audience: 'your-api-identifier',
    }),
    DismissibleModule.forRoot({
      hooks: [JwtAuthHook],
    }),
  ],
})
export class AppModule {}
```

### JWT Hook Configuration

| Option              | Type       | Required | Default     | Description                            |
| ------------------- | ---------- | -------- | ----------- | -------------------------------------- |
| `enabled`           | `boolean`  | Yes      | `true`      | Enable/disable JWT authentication      |
| `wellKnownUrl`      | `string`   | Yes\*    | -           | OIDC well-known URL for JWKS discovery |
| `issuer`            | `string`   | No       | -           | Expected issuer claim                  |
| `audience`          | `string`   | No       | -           | Expected audience claim                |
| `algorithms`        | `string[]` | No       | `['RS256']` | Allowed algorithms                     |
| `jwksCacheDuration` | `number`   | No       | `600000`    | JWKS cache duration (ms)               |
| `priority`          | `number`   | No       | `-100`      | Hook priority (lower runs first)       |

\* Required only when `enabled` is `true`.

See the [@dismissible/nestjs-jwt-auth-hook README](../libs/jwt-auth-hook/README.md) for more details.

## Rate Limiting

Protect your API from abuse using the optional Rate Limiter Hook. It uses in-memory rate limiting based on IP address, Origin header, or Referer header:

```bash
npm install @dismissible/nestjs-rate-limiter-hook
```

```typescript
import { Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-api';
import { RateLimiterHookModule, RateLimiterHook } from '@dismissible/nestjs-rate-limiter-hook';

@Module({
  imports: [
    RateLimiterHookModule.forRoot({
      enabled: true,
      points: 1000, // 1000 requests
      duration: 1, // per 1 second
      blockDuration: 60, // block for 60 seconds after limit exceeded
      keyType: ['ip', 'origin', 'referrer'],
      keyMode: 'any', // check all key types independently
    }),
    DismissibleModule.forRoot({
      hooks: [RateLimiterHook],
    }),
  ],
})
export class AppModule {}
```

### Rate Limiter Configuration

| Option          | Type                 | Required | Default | Description                                                     |
| --------------- | -------------------- | -------- | ------- | --------------------------------------------------------------- |
| `enabled`       | `boolean`            | Yes      | -       | Whether rate limiting is enabled                                |
| `points`        | `number`             | Yes\*    | -       | Number of requests allowed per duration                         |
| `duration`      | `number`             | Yes\*    | -       | Time window in seconds                                          |
| `blockDuration` | `number`             | No       | -       | Duration in seconds to block requests after limit is exceeded   |
| `keyType`       | `RateLimitKeyType[]` | Yes\*    | -       | Key source(s) for rate limiting: `ip`, `origin`, `referrer`     |
| `keyMode`       | `RateLimitKeyMode`   | No       | `and`   | Mode for combining key types: `and`, `or`, `any`                |
| `ignoredKeys`   | `string[]`           | No       | -       | Keys to bypass rate limiting (exact match after trim+lowercase) |
| `priority`      | `number`             | No       | `-101`  | Hook priority (lower numbers run first)                         |

\* Required when `enabled` is `true`.

### Key Types

- **`ip`**: Rate limit by IP address (extracted from `x-forwarded-for` or `x-real-ip` headers)
- **`origin`**: Rate limit by Origin header hostname
- **`referrer`**: Rate limit by Referer header hostname

### Key Modes

- **`and`**: Combine all key types into a single key (e.g., `192.168.1.1:example.com`)
- **`or`**: Use the first available key type as a fallback chain
- **`any`**: Check all key types independently - request is blocked if ANY key exceeds the limit

See the [@dismissible/nestjs-rate-limiter-hook README](../libs/rate-limiter-hook/README.md) for more details.

## Lifecycle Hooks

Lifecycle hooks allow you to intercept operations and add custom logic, validation, analytics, or mutations.

### Creating a Hook

Create a class that implements `IDismissibleLifecycleHook`:

```typescript
import { Injectable } from '@nestjs/common';
import { IDismissibleLifecycleHook, IHookResult, IRequestContext } from '@dismissible/nestjs-api';
import { DismissibleItemDto } from '@dismissible/nestjs-item';

@Injectable()
export class AuditHook implements IDismissibleLifecycleHook {
  // Optional: Set priority (lower numbers run first, default is 0)
  readonly priority = 10;

  async onAfterCreate(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    console.log(`[AUDIT] Item created: ${itemId} for user ${userId}`);
  }

  async onAfterDismiss(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    console.log(`[AUDIT] Item dismissed: ${itemId} by user ${userId}`);
  }
}
```

Register hooks in your module configuration:

```typescript
DismissibleModule.forRoot({
  hooks: [AuditHook],
});
```

### Hook Methods

All hook methods are optional. Implement only what you need:

#### Global Request Hooks (run on ALL operations)

| Method              | When Called                   | Can Block | Can Mutate |
| ------------------- | ----------------------------- | --------- | ---------- |
| `onBeforeRequest()` | At the start of any operation | Yes       | Yes        |
| `onAfterRequest()`  | At the end of any operation   | No        | No         |

Use global hooks for cross-cutting concerns like authentication, rate limiting, audit logging, and metrics.

#### Get Hooks (when retrieving existing item)

| Method          | When Called                    | Can Block | Can Mutate |
| --------------- | ------------------------------ | --------- | ---------- |
| `onBeforeGet()` | Before returning existing item | Yes       | Yes        |
| `onAfterGet()`  | After returning existing item  | No        | No         |

Get hooks only run when an item already exists in storage. Use for access control based on item state.

#### Create Hooks (when creating new item)

| Method             | When Called                | Can Block | Can Mutate |
| ------------------ | -------------------------- | --------- | ---------- |
| `onBeforeCreate()` | Before creating a new item | Yes       | Yes        |
| `onAfterCreate()`  | After creating a new item  | No        | No         |

#### Dismiss Hooks

| Method              | When Called               | Can Block | Can Mutate |
| ------------------- | ------------------------- | --------- | ---------- |
| `onBeforeDismiss()` | Before dismissing an item | Yes       | Yes        |
| `onAfterDismiss()`  | After dismissing an item  | No        | No         |

#### Restore Hooks

| Method              | When Called              | Can Block | Can Mutate |
| ------------------- | ------------------------ | --------- | ---------- |
| `onBeforeRestore()` | Before restoring an item | Yes       | Yes        |
| `onAfterRestore()`  | After restoring an item  | No        | No         |

### Batch Hook Methods

Batch hooks are invoked during batch operations (e.g., `batchGetOrCreate`). They follow the same patterns as single-item hooks but operate on arrays of items.

#### Understanding Batch Hook Semantics

**Blocking Behavior:**

- When a batch hook returns `{ proceed: false }`, the **entire batch operation is blocked** - no items are processed
- To filter or control access to specific items, modify the items array within the hook instead of blocking
- Blocking is all-or-nothing for the entire batch

**Filtering and Access Control:**

- Batch hooks receive the full array of items and can filter/modify the list
- To implement per-item access control, filter the items array in `onBeforeBatchGet()` or `onBeforeBatchCreate()`
- The filtered list is what gets processed by the operation

**Partial Failures:**

- Post-hooks (`onAfterBatchGet`, `onAfterBatchCreate`) only run after successful operations
- If the batch operation fails (storage error, validation error), post-hooks are not invoked
- Pre-hooks can prevent operations, but storage-level errors bypass post-hooks

**Example - Filtering Items Based on Access Control:**

```typescript
@Injectable()
export class AccessControlHook implements IDismissibleLifecycleHook {
  async onBeforeBatchGet(
    itemIds: string[],
    items: DismissibleItemDto[],
    userId: string,
    context?: IRequestContext,
  ): Promise<IBatchHookResult> {
    // Filter to only items the user can access
    const accessibleItems = items.filter((item) => this.canAccess(item, userId));

    if (accessibleItems.length !== items.length) {
      console.log(`Filtered ${items.length - accessibleItems.length} inaccessible items`);
    }

    // Continue with filtered list (not blocked, just filtered)
    return { proceed: true };
  }

  private canAccess(item: DismissibleItemDto, userId: string): boolean {
    // Implement your access control logic
    return item.userId === userId;
  }
}
```

#### Global Batch Request Hooks (run on ALL batch operations)

| Method                   | When Called                         | Can Block | Can Mutate |
| ------------------------ | ----------------------------------- | --------- | ---------- |
| `onBeforeBatchRequest()` | At the start of any batch operation | Yes       | Yes        |
| `onAfterBatchRequest()`  | At the end of any batch operation   | No        | No         |

Use global batch hooks for cross-cutting concerns like authentication, rate limiting, audit logging, and metrics on batch operations.

#### Batch Get Hooks (when retrieving existing items)

| Method               | When Called                     | Can Block | Can Mutate |
| -------------------- | ------------------------------- | --------- | ---------- |
| `onBeforeBatchGet()` | Before returning existing items | Yes       | Yes        |
| `onAfterBatchGet()`  | After returning existing items  | No        | No         |

Batch get hooks run when items already exist in storage. Use for access control based on item state.

#### Batch Create Hooks (when creating new items)

| Method                  | When Called               | Can Block | Can Mutate |
| ----------------------- | ------------------------- | --------- | ---------- |
| `onBeforeBatchCreate()` | Before creating new items | Yes       | Yes        |
| `onAfterBatchCreate()`  | After creating new items  | No        | No         |

#### Batch Hook Example

Here's an example hook implementing batch operations:

```typescript
import { Injectable } from '@nestjs/common';
import {
  IDismissibleLifecycleHook,
  IBatchHookResult,
  IRequestContext,
} from '@dismissible/nestjs-api';
import { DismissibleItemDto } from '@dismissible/nestjs-item';

@Injectable()
export class BatchAuditHook implements IDismissibleLifecycleHook {
  readonly priority = 10;

  // Validate batch requests before any batch operation
  async onBeforeBatchRequest(
    itemIds: string[],
    userId: string,
    context?: IRequestContext,
  ): Promise<IBatchHookResult> {
    // Validate batch size
    if (itemIds.length > 50) {
      return {
        proceed: false,
        reason: 'Batch size exceeds maximum of 50 items',
      };
    }

    // Optionally mutate item IDs (e.g., normalize)
    return {
      proceed: true,
      mutations: {
        ids: itemIds.map((id) => id.toLowerCase().trim()),
      },
    };
  }

  // Audit log after batch operations complete
  async onAfterBatchRequest(
    items: DismissibleItemDto[],
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    console.log(`[AUDIT] Batch operation completed: ${items.length} items for user ${userId}`);
  }

  // Access control for batch get operations
  async onBeforeBatchGet(
    itemIds: string[],
    items: DismissibleItemDto[],
    userId: string,
    context?: IRequestContext,
  ): Promise<IBatchHookResult> {
    // Filter out items the user shouldn't access
    const accessibleItems = items.filter((item) => this.canAccess(item, userId));

    if (accessibleItems.length !== items.length) {
      console.log(
        `[ACCESS] Filtered ${items.length - accessibleItems.length} items for user ${userId}`,
      );
    }

    return { proceed: true };
  }

  // Track batch creations
  async onAfterBatchCreate(
    items: DismissibleItemDto[],
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    console.log(`[AUDIT] Batch created: ${items.length} items for user ${userId}`);
  }

  private canAccess(item: DismissibleItemDto, userId: string): boolean {
    return item.userId === userId;
  }
}
```

#### Batch Hook Execution Order

For a `batchGetOrCreate` operation:

1. `onBeforeBatchRequest()` - Global batch pre-hook
2. For each item being retrieved: `onBeforeBatchGet()` - Get-specific pre-hook
3. For each item being created: `onBeforeBatchCreate()` - Create-specific pre-hook
4. _Items are retrieved/created in storage_
5. For retrieved items: `onAfterBatchGet()` - Get-specific post-hook
6. For created items: `onAfterBatchCreate()` - Create-specific post-hook
7. `onAfterBatchRequest()` - Global batch post-hook

### Hook Execution Order

For a typical `getOrCreate` operation that creates a new item:

1. `onBeforeRequest()` - Global pre-hook
2. `onBeforeCreate()` - Create-specific pre-hook
3. _Item is created in storage_
4. `onAfterCreate()` - Create-specific post-hook
5. `onAfterRequest()` - Global post-hook

For a `getOrCreate` that retrieves an existing item:

1. `onBeforeRequest()` - Global pre-hook
2. `onBeforeGet()` - Get-specific pre-hook (receives the existing item)
3. `onAfterGet()` - Get-specific post-hook
4. `onAfterRequest()` - Global post-hook

### Hook Priority

Hooks are executed in order of priority (lower numbers run first):

```typescript
@Injectable()
export class ValidationHook implements IDismissibleLifecycleHook {
  readonly priority = 0; // Runs first
}

@Injectable()
export class AuditHook implements IDismissibleLifecycleHook {
  readonly priority = 10; // Runs second
}

@Injectable()
export class AnalyticsHook implements IDismissibleLifecycleHook {
  readonly priority = 100; // Runs last
}
```

### Blocking Operations

Pre-hooks can block operations by returning `{ proceed: false }`:

```typescript
@Injectable()
export class RateLimitHook implements IDismissibleLifecycleHook {
  constructor(private readonly rateLimiter: RateLimiterService) {}

  // Use onBeforeRequest to apply rate limiting to ALL operations
  async onBeforeRequest(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    const allowed = await this.rateLimiter.check(userId);

    if (!allowed) {
      return {
        proceed: false,
        reason: 'Rate limit exceeded. Please try again later.',
      };
    }

    return { proceed: true };
  }
}
```

```typescript
@Injectable()
export class ProtectedItemsHook implements IDismissibleLifecycleHook {
  private readonly protectedPrefixes = ['system-', 'critical-', 'required-'];

  // Prevent dismissing protected items
  async onBeforeDismiss(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    const isProtected = this.protectedPrefixes.some((prefix) => itemId.startsWith(prefix));

    if (isProtected) {
      return {
        proceed: false,
        reason: `Cannot dismiss protected item: ${itemId}`,
      };
    }

    return { proceed: true };
  }
}
```

### Hook Error Handling

Hooks can signal errors or block operations in two ways:

#### Pattern 1: Graceful Blocking with Custom Reason

Return `{ proceed: false }` to gracefully block an operation with a user-friendly message. This pattern is ideal for business logic validation, rate limiting, and access control where you want to provide context to the user.

```typescript
@Injectable()
export class AccessControlHook implements IDismissibleLifecycleHook {
  async onBeforeRequest(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    const hasAccess = await this.checkUserAccess(userId);

    if (!hasAccess) {
      return {
        proceed: false,
        reason: 'User not authorized to access this resource',
      };
    }

    return { proceed: true };
  }
}
```

#### Pattern 2: Hard Failure with Exception

Throw a NestJS exception to immediately halt the operation with an HTTP error. This pattern is ideal for unexpected errors, invalid data, or conditions that should result in an error response.

```typescript
@Injectable()
export class ValidationHook implements IDismissibleLifecycleHook {
  async onBeforeRequest(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    // Block requests for items starting with 'blocked-'
    if (itemId.startsWith('blocked-')) {
      throw new BadRequestException('Item is blocked by system policy');
    }

    // Validate item ID format
    if (!this.isValidFormat(itemId)) {
      throw new BadRequestException('Invalid item ID format');
    }

    return { proceed: true };
  }

  private isValidFormat(itemId: string): boolean {
    return /^[a-zA-Z0-9-_]+$/.test(itemId);
  }
}
```

#### When to Use Each Pattern

| Use Case                          | Pattern                           | Why                                                      |
| --------------------------------- | --------------------------------- | -------------------------------------------------------- |
| Rate limiting                     | Return `{ proceed: false }`       | User can retry later                                     |
| Access control                    | Return `{ proceed: false }`       | Clear authorization failure                              |
| Business rule validation          | Return `{ proceed: false }`       | Expected validation, not an error                        |
| Invalid data format               | Throw exception                   | Programming error, should not happen in normal flow      |
| System errors (DB, network)       | Throw exception                   | Unexpected failures requiring attention                  |
| Required dependencies missing     | Throw exception                   | Configuration issue                                      |
| Protected items (can't be edited) | Either (choose for your use case) | Depends if it's expected validation or programming error |

Both patterns will result in the operation being blocked, but exceptions will bubble up as HTTP errors (400, 401, 500, etc.) while `{ proceed: false }` returns a success response with a message explaining why the operation was not performed.

### Mutating Parameters

Pre-hooks can modify the item ID, user ID, or context before the operation:

```typescript
@Injectable()
export class NormalizationHook implements IDismissibleLifecycleHook {
  // Use onBeforeRequest for mutations that apply to ALL operations
  async onBeforeRequest(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    return {
      proceed: true,
      mutations: {
        // Normalize item IDs to lowercase
        id: itemId.toLowerCase().trim(),
        // Normalize user IDs
        userId: userId.toLowerCase().trim(),
      },
    };
  }
}
```

```typescript
@Injectable()
export class TenantPrefixHook implements IDismissibleLifecycleHook {
  // Global hook runs before all operations
  async onBeforeRequest(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    // Add tenant prefix to item IDs for multi-tenancy
    const tenantId = context?.tenantId | 'default';

    return {
      proceed: true,
      mutations: {
        id: `${tenantId}:${itemId}`,
      },
    };
  }
}
```

### Complete Hook Example

Here's a comprehensive example combining multiple hook features:

```typescript
import { Injectable } from '@nestjs/common';
import { IDismissibleLifecycleHook, IHookResult, IRequestContext } from '@dismissible/nestjs-api';
import { DismissibleItemDto } from '@dismissible/nestjs-item';

@Injectable()
export class ComprehensiveHook implements IDismissibleLifecycleHook {
  readonly priority = 5;

  constructor(
    private readonly analytics: AnalyticsService,
    private readonly featureFlags: FeatureFlagService,
  ) {}

  // Validate and normalize before ANY operation (global pre-hook)
  async onBeforeRequest(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    // Validate item ID format
    if (!this.isValidItemId(itemId)) {
      return {
        proceed: false,
        reason: 'Invalid item ID format',
      };
    }

    return {
      proceed: true,
      mutations: {
        id: itemId.toLowerCase(),
      },
    };
  }

  // Global audit logging after ANY operation
  async onAfterRequest(
    itemId: string,
    item: DismissibleItemDto<AnalyticsMetadata>,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    console.log(`[AUDIT] Operation completed: ${itemId} for user ${userId}`);
  }

  // Track item creation
  async onAfterCreate(
    itemId: string,
    item: DismissibleItemDto<AnalyticsMetadata>,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    await this.analytics.track('dismissible_created', {
      itemId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  // Check feature flag before dismissing
  async onBeforeDismiss(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    const canDismiss = await this.featureFlags.isEnabled('allow_dismissals', userId);

    if (!canDismiss) {
      return {
        proceed: false,
        reason: 'Dismissals are currently disabled',
      };
    }

    return { proceed: true };
  }

  // Track dismissals for analytics
  async onAfterDismiss(
    itemId: string,
    item: DismissibleItemDto<AnalyticsMetadata>,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    await this.analytics.track('dismissible_dismissed', {
      itemId,
      userId,
      timeToAction: this.calculateTimeToAction(item),
    });
  }

  private isValidItemId(itemId: string): boolean {
    return /^[a-zA-Z0-9-_]+$/.test(itemId);
  }

  private calculateTimeToAction(item: DismissibleItemDto<AnalyticsMetadata>): number {
    if (!item.dismissedAt | !item.createdAt) return 0;
    return new Date(item.dismissedAt).getTime() - new Date(item.createdAt).getTime();
  }
}
```

### Advanced Hook Examples

#### Multi-Tenancy Hook with Isolation

Implement complete tenant isolation by prefixing item IDs with tenant identifiers and filtering batch results:

```typescript
import { Injectable } from '@nestjs/common';
import {
  IDismissibleLifecycleHook,
  IHookResult,
  IBatchHookResult,
  IRequestContext,
} from '@dismissible/nestjs-api';
import { DismissibleItemDto } from '@dismissible/nestjs-item';

@Injectable()
export class TenantIsolationHook implements IDismissibleLifecycleHook {
  readonly priority = 5;

  // Add tenant prefix to all item IDs
  async onBeforeRequest(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    const tenantId = context?.tenantId || 'default';

    // Prefix item ID with tenant for isolation
    return {
      proceed: true,
      mutations: {
        id: `${tenantId}:${itemId}`,
      },
    };
  }

  // Filter batch results to only include items from the current tenant
  async onBeforeBatchGet(
    itemIds: string[],
    items: DismissibleItemDto[],
    userId: string,
    context?: IRequestContext,
  ): Promise<IBatchHookResult> {
    const tenantId = context?.tenantId || 'default';

    // Filter out items from other tenants
    const tenantItems = items.filter((item) => item.id.startsWith(`${tenantId}:`));

    if (tenantItems.length !== items.length) {
      console.log(
        `[TENANT] Filtered ${items.length - tenantItems.length} items from other tenants`,
      );
    }

    return { proceed: true };
  }

  // Prefix all item IDs in batch requests
  async onBeforeBatchRequest(
    itemIds: string[],
    userId: string,
    context?: IRequestContext,
  ): Promise<IBatchHookResult> {
    const tenantId = context?.tenantId || 'default';

    return {
      proceed: true,
      mutations: {
        ids: itemIds.map((id) => `${tenantId}:${id}`),
      },
    };
  }
}
```

#### Multiple Hooks with Priority Ordering

When using multiple hooks together, priority determines execution order:

```typescript
import { Injectable } from '@nestjs/common';
import { IDismissibleLifecycleHook, IHookResult, IRequestContext } from '@dismissible/nestjs-api';

// Priority 1: Authentication runs first
@Injectable()
export class AuthenticationHook implements IDismissibleLifecycleHook {
  readonly priority = 1;

  async onBeforeRequest(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    // Verify user is authenticated
    if (!userId || userId === 'anonymous') {
      return {
        proceed: false,
        reason: 'Authentication required',
      };
    }
    return { proceed: true };
  }
}

// Priority 5: Normalization runs after auth
@Injectable()
export class NormalizationHook implements IDismissibleLifecycleHook {
  readonly priority = 5;

  async onBeforeRequest(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    return {
      proceed: true,
      mutations: {
        id: itemId.toLowerCase().trim(),
        userId: userId.toLowerCase().trim(),
      },
    };
  }
}

// Priority 10: Access control runs after normalization
@Injectable()
export class AccessControlHook implements IDismissibleLifecycleHook {
  readonly priority = 10;

  async onBeforeRequest(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    const hasAccess = await this.checkAccess(userId, itemId);

    if (!hasAccess) {
      return {
        proceed: false,
        reason: 'Access denied',
      };
    }
    return { proceed: true };
  }

  private async checkAccess(userId: string, itemId: string): Promise<boolean> {
    // Implement your access control logic
    return true;
  }
}

// Priority 100: Audit logging runs last
@Injectable()
export class AuditLoggingHook implements IDismissibleLifecycleHook {
  readonly priority = 100;

  async onAfterRequest(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    // Log after all other hooks have run
    console.log(`[AUDIT] ${context?.operation}: ${itemId} by ${userId}`);
  }
}

// Register hooks in priority order
@Module({
  imports: [
    DismissibleModule.forRoot({
      hooks: [
        AuthenticationHook, // priority: 1
        NormalizationHook, // priority: 5
        AccessControlHook, // priority: 10
        AuditLoggingHook, // priority: 100
      ],
    }),
  ],
})
export class AppModule {}
```

#### Feature Flag Integration Hook

Control feature availability using feature flags:

```typescript
import { Injectable } from '@nestjs/common';
import { IDismissibleLifecycleHook, IHookResult, IRequestContext } from '@dismissible/nestjs-api';

@Injectable()
export class FeatureFlagHook implements IDismissibleLifecycleHook {
  readonly priority = 15;

  constructor(private readonly featureFlags: FeatureFlagService) {}

  async onBeforeDismiss(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    // Check if dismissals are enabled for this user
    const dismissalsEnabled = await this.featureFlags.isEnabled('dismissible-ui', userId);

    if (!dismissalsEnabled) {
      return {
        proceed: false,
        reason: 'Dismissible UI feature is not available for your account',
      };
    }

    return { proceed: true };
  }

  async onBeforeRestore(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    // Check if restore feature is enabled
    const restoreEnabled = await this.featureFlags.isEnabled('dismissible-restore', userId);

    if (!restoreEnabled) {
      return {
        proceed: false,
        reason: 'Restore feature is not available',
      };
    }

    return { proceed: true };
  }

  async onBeforeCreate(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    // Block creation of specific item types based on feature flags
    if (
      itemId.startsWith('premium-') &&
      !(await this.featureFlags.isEnabled('premium-features', userId))
    ) {
      return {
        proceed: false,
        reason: 'Premium features not available',
      };
    }

    return { proceed: true };
  }
}
```

#### Hook Testing Pattern

Use a tracking utility to test hook execution in your test suite:

```typescript
import { Injectable } from '@nestjs/common';
import { IDismissibleLifecycleHook, IHookResult, IRequestContext } from '@dismissible/nestjs-api';
import { DismissibleItemDto } from '@dismissible/nestjs-item';

// Testing utility for tracking hook calls
export class HookTracker {
  private static events: Array<{ hook: string; method: string; itemId: string }> = [];

  static track(hook: string, method: string, itemId: string): void {
    this.events.push({ hook, method, itemId });
  }

  static getEvents(): Array<{ hook: string; method: string; itemId: string }> {
    return [...this.events];
  }

  static clear(): void {
    this.events = [];
  }

  static hasEvent(hook: string, method: string, itemId: string): boolean {
    return this.events.some((e) => e.hook === hook && e.method === method && e.itemId === itemId);
  }
}

// Hook implementation with tracking
@Injectable()
export class TrackableHook implements IDismissibleLifecycleHook {
  readonly priority = 10;

  async onBeforeCreate(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    HookTracker.track('TrackableHook', 'onBeforeCreate', itemId);
    return { proceed: true };
  }

  async onAfterCreate(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    HookTracker.track('TrackableHook', 'onAfterCreate', itemId);
  }

  async onAfterDismiss(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    HookTracker.track('TrackableHook', 'onAfterDismiss', itemId);
  }
}

// Example test using HookTracker
describe('DismissibleService with Hooks', () => {
  let service: DismissibleService;

  beforeEach(() => {
    HookTracker.clear();
  });

  it('should call onBeforeCreate and onAfterCreate hooks', async () => {
    const result = await service.getOrCreate('test-item', 'user-123');

    expect(result.created).toBe(true);
    expect(HookTracker.hasEvent('TrackableHook', 'onBeforeCreate', 'test-item')).toBe(true);
    expect(HookTracker.hasEvent('TrackableHook', 'onAfterCreate', 'test-item')).toBe(true);
  });

  it('should call onAfterDismiss hook', async () => {
    await service.getOrCreate('test-item', 'user-123');
    await service.dismiss('test-item', 'user-123');

    expect(HookTracker.hasEvent('TrackableHook', 'onAfterDismiss', 'test-item')).toBe(true);
  });

  it('should track execution order of multiple hooks', async () => {
    await service.getOrCreate('test-item', 'user-123');

    const events = HookTracker.getEvents();
    expect(events[0].method).toBe('onBeforeCreate');
    expect(events[1].method).toBe('onAfterCreate');
  });
});
```

## Events

The module emits events for all operations using NestJS's `EventEmitter2`.

### Available Events

| Event Constant                     | Event Class          | Description                          |
| ---------------------------------- | -------------------- | ------------------------------------ |
| `DismissibleEvents.ITEM_CREATED`   | `ItemCreatedEvent`   | Emitted when a new item is created   |
| `DismissibleEvents.ITEM_RETRIEVED` | `ItemRetrievedEvent` | Emitted when existing item retrieved |
| `DismissibleEvents.ITEM_DISMISSED` | `ItemDismissedEvent` | Emitted when an item is dismissed    |
| `DismissibleEvents.ITEM_RESTORED`  | `ItemRestoredEvent`  | Emitted when an item is restored     |

### Event Properties

All events include:

```typescript
{
  id: string;                              // The item identifier
    item: DismissibleItemDto;     // Current item state
  userId: string;                          // The user identifier
  context?: IRequestContext;               // Optional request context
}
```

`ItemDismissedEvent` and `ItemRestoredEvent` also include:

```typescript
{
  previousItem: DismissibleItemDto; // Item state before the operation
}
```

### Listening to Events

Use the `@OnEvent` decorator from `@nestjs/event-emitter`:

```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  DismissibleEvents,
  ItemCreatedEvent,
  ItemDismissedEvent,
  ItemRestoredEvent,
  ItemRetrievedEvent,
} from '@dismissible/nestjs-api';

@Injectable()
export class DismissibleEventHandler {
  @OnEvent(DismissibleEvents.ITEM_CREATED)
  handleItemCreated(event: ItemCreatedEvent) {
    console.log(`New item created: ${event.id} for user ${event.userId}`);
    // Send to analytics, trigger webhooks, etc.
  }

  @OnEvent(DismissibleEvents.ITEM_DISMISSED)
  handleItemDismissed(event: ItemDismissedEvent) {
    console.log(`Item dismissed: ${event.id}`);
    console.log(`Was created at: ${event.previousItem.createdAt}`);
    console.log(`Dismissed at: ${event.item.dismissedAt}`);
  }

  @OnEvent(DismissibleEvents.ITEM_RESTORED)
  handleItemRestored(event: ItemRestoredEvent) {
    console.log(`Item restored: ${event.id}`);
    // Maybe notify the user or update caches
  }

  @OnEvent(DismissibleEvents.ITEM_RETRIEVED)
  handleItemRetrieved(event: ItemRetrievedEvent) {
    // Track item views/impressions
    console.log(`Item viewed: ${event.id} by user ${event.userId}`);
  }
}
```

Register your event handler as a provider:

```typescript
@Module({
  imports: [DismissibleModule.forRoot({})],
  providers: [DismissibleEventHandler],
})
export class AppModule {}
```

## Custom Logger

Provide a custom logger implementation:

```typescript
import { Injectable } from '@nestjs/common';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';

@Injectable()
export class CustomLogger implements IDismissibleLogger {
  debug(message: string, context?: Record<string, unknown>) {
    // Your logging implementation
    console.debug(`[DISMISSIBLE] ${message}`, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    console.info(`[DISMISSIBLE] ${message}`, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    console.warn(`[DISMISSIBLE] ${message}`, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    console.error(`[DISMISSIBLE] ${message}`, context);
  }
}
```

Register in your module:

```typescript
DismissibleModule.forRoot({
  logger: CustomLogger,
});
```

## React Client Integration

This library works seamlessly with [@dismissible/react-client](https://www.npmjs.com/package/@dismissible/react-client):

```bash
npm install @dismissible/react-client
```

```tsx
import { DismissibleProvider, useDismissible, Dismissible } from '@dismissible/react-client';

function App() {
  return (
    <DismissibleProvider apiUrl="http://localhost:3001" userId="user-123">
      <WelcomeBanner />
      <FeatureAnnouncement />
    </DismissibleProvider>
  );
}

// Using the hook
function WelcomeBanner() {
  const { item, dismiss, restore, isLoading } = useDismissible('welcome-banner');

  if (isLoading) return <div>Loading...</div>;
  if (item?.dismissedAt) return null;

  return (
    <div className="banner">
      <h2>Welcome to our app!</h2>
      <p>We're glad you're here.</p>
      <button onClick={() => dismiss()}>Got it</button>
    </div>
  );
}

// Using the component
function FeatureAnnouncement() {
  return (
    <Dismissible id="new-feature-announcement">
      <div className="announcement">
        <h3>New Feature Available!</h3>
        <p>Check out our latest update.</p>
      </div>
    </Dismissible>
  );
}
```

## API Reference

### DismissibleService

The main service for interacting with dismissible items.

#### `getOrCreate(itemId, userId, context?)`

Retrieves an existing item or creates a new one.

| Parameter | Type              | Required | Description                    |
| --------- | ----------------- | -------- | ------------------------------ |
| `itemId`  | `string`          | Yes      | Unique identifier for the item |
| `userId`  | `string`          | Yes      | User identifier                |
| `context` | `IRequestContext` | No       | Request context for tracing    |

Returns: `Promise<IGetOrCreateServiceResponse>`

```typescript
interface IGetOrCreateServiceResponse {
  item: DismissibleItemDto;
  created: boolean;
}
```

#### `dismiss(itemId, userId, context?)`

Marks an item as dismissed.

| Parameter | Type              | Required | Description                 |
| --------- | ----------------- | -------- | --------------------------- |
| `itemId`  | `string`          | Yes      | Item identifier             |
| `userId`  | `string`          | Yes      | User identifier             |
| `context` | `IRequestContext` | No       | Request context for tracing |

Returns: `Promise<IDismissServiceResponse>`

```typescript
interface IDismissServiceResponse {
  item: DismissibleItemDto;
}
```

#### `restore(itemId, userId, context?)`

Restores a previously dismissed item.

| Parameter | Type              | Required | Description                 |
| --------- | ----------------- | -------- | --------------------------- |
| `itemId`  | `string`          | Yes      | Item identifier             |
| `userId`  | `string`          | Yes      | User identifier             |
| `context` | `IRequestContext` | No       | Request context for tracing |

Returns: `Promise<IRestoreServiceResponse>`

```typescript
interface IRestoreServiceResponse {
  item: DismissibleItemDto;
}
```

#### `batchGetOrCreate(itemIds, userId, context?)`

Retrieves existing items or creates new ones for multiple item IDs in a single request.

| Parameter | Type              | Required | Description                            |
| --------- | ----------------- | -------- | -------------------------------------- |
| `itemIds` | `string[]`        | Yes      | Array of item identifiers (1-50 items) |
| `userId`  | `string`          | Yes      | User identifier                        |
| `context` | `IRequestContext` | No       | Request context for tracing            |

Returns: `Promise<IBatchGetOrCreateServiceResponse>`

```typescript
interface IBatchGetOrCreateServiceResponse {
  items: DismissibleItemDto[];
}
```

### DismissibleItemDto

The data transfer object representing a dismissible item.

```typescript
interface DismissibleItemDto {
  id: string;
  userId: string;
  createdAt: string;
  dismissedAt: string | null;
}
```

### IRequestContext

Optional context passed through operations for tracing and multi-tenancy.

```typescript
interface IRequestContext {
  requestId?: string;
  tenantId?: string;
  [key: string]: unknown;
}
```

## License

MIT - This project is open source and free to use.

---

<p align="center">
  <a href="https://dismissible.io">dismissible.io</a> · 
  <a href="https://github.com/dismissible/dismissible-api">GitHub</a>
</p>
