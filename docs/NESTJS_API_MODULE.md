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
- [Lifecycle Hooks](#lifecycle-hooks)
  - [Creating a Hook](#creating-a-hook)
  - [Hook Methods](#hook-methods)
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

| Endpoint                          | Method   | Description                          |
| --------------------------------- | -------- | ------------------------------------ |
| `/v1/users/:userId/items/:itemId` | `GET`    | Get or create a dismissible item     |
| `/v1/users/:userId/items/:itemId` | `DELETE` | Dismiss an item (marks as dismissed) |
| `/v1/users/:userId/items/:itemId` | `POST`   | Restore a previously dismissed item  |

### Example Requests

```bash
# Get or create an item
curl "http://localhost:3001/v1/users/user-123/items/welcome-banner"

# Dismiss an item
curl -X DELETE "http://localhost:3001/v1/users/user-123/items/welcome-banner"

# Restore a dismissed item
curl -X POST "http://localhost:3001/v1/users/user-123/items/welcome-banner"
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

The default storage adapter keeps items in memory. Data is lost on application restart. This is ideal for development and testing.

```typescript
DismissibleModule.forRoot({
  // No storage option = memory storage
});
```

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
