<p align="center">
  <a href="https://dismissible.io" target="_blank"><img src="../../docs/images/dismissible_logo.png" width="240" alt="Dismissible" /></a>
</p>

  <p align="center">Never Show The Same Thing Twice!</p>
    <p align="center">
<a href="https://www.npmjs.com/package/@dismissible/nestjs-core" target="_blank"><img src="https://img.shields.io/npm/v/@dismissible/nestjs-core.svg" alt="NPM Version" /></a>
<a href="https://github.com/dismissibleio/dismissible-api/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@dismissible/nestjs-core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/package/@dismissible/nestjs-core" target="_blank"><img src="https://img.shields.io/npm/dm/@dismissible/nestjs-core.svg" alt="NPM Downloads" /></a>
<a href="https://github.com/dismissibleio/dismissible-api" target="_blank"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/dismissibleio/dismissible-api/release.yml">
</a>
<a href="https://paypal.me/joshstuartx" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
</p>

# @dismissible/nestjs-core

A powerful NestJS library for managing dismissible state in your applications. Perfect for guided tours, user preferences, onboarding flows, and any scenario where you need to track whether a user has dismissed or interacted with specific items.

> **Part of the Dismissible API** - This library is part of the [Dismissible API](https://dismissible.io) ecosystem. Visit [dismissible.io](https://dismissible.io) for more information and documentation.

## Features

- **Simple API** - Easy-to-use service methods for get-or-create, dismiss, and restore operations
- **High Performance** - Built on Fastify for maximum throughput
- **Flexible Storage** - Default memory storage with support for custom storage adapters (PostgreSQL, Redis, etc.)
- **Lifecycle Hooks** - Intercept and customize operations with pre/post hooks
- **JWT Authentication** - Optional JWT auth hook for securing endpoints with OIDC providers
- **Event-Driven** - Built-in event emission for all operations
- **Type-Safe** - Full TypeScript support
- **Validation** - Automatic validation of dismissible items
- **Swagger Integration** - Auto-generated API documentation
- **React Client** - Works out of the box with [@dismissible/react-client](https://www.npmjs.com/package/@dismissible/react-client)

## Installation

```bash
npm install @dismissible/nestjs-core
```

## Getting Started

### Basic Setup

The simplest way to get started is with the default configuration, which uses memory storage:

```typescript
import { Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-core';

@Module({
  imports: [DismissibleModule.forRoot({})],
})
export class AppModule {}
```

### Built-in REST API

The module automatically registers REST endpoints for all operations:

- `GET /v1/users/:userId/items/:itemId` - Get or create an item
- `DELETE /v1/users/:userId/items/:itemId` - Dismiss an item
- `POST /v1/users/:userId/items/:itemId` - Restore a dismissed item

Example request:

```bash
# Get or create an item
curl http://localhost:3000/v1/users/user-123/items/welcome-banner

# Dismiss an item
curl -X DELETE http://localhost:3000/v1/users/user-123/items/welcome-banner

# Restore a dismissed item
curl -X POST http://localhost:3000/v1/users/user-123/items/welcome-banner
```

### React Client Integration

This library works seamlessly with the [@dismissible/react-client](https://www.npmjs.com/package/@dismissible/react-client) package. Once your NestJS backend is set up with the built-in REST API endpoints, you can use the React client in your frontend:

```bash
npm install @dismissible/react-client
```

```typescript
import { DismissibleProvider, useDismissible } from '@dismissible/react-client';

function App() {
  return (
    <DismissibleProvider
      apiUrl="http://localhost:3000"
      userId="user-123"
    >
      <WelcomeBanner />
    </DismissibleProvider>
  );
}

function WelcomeBanner() {
  const { item, dismiss, isLoading } = useDismissible('welcome-banner');

  if (isLoading) return <div>Loading...</div>;
  if (item?.dismissedAt) return null;

  return (
    <div>
      <h2>Welcome!</h2>
      <button onClick={() => dismiss()}>Dismiss</button>
    </div>
  );
}
```

The React client automatically uses the built-in REST API endpoints, so no additional configuration is needed on the backend.

## Advanced Usage

### Using PostgreSQL Storage

To persist dismissible items in a PostgreSQL database, use the `PostgresStorageModule`:

```typescript
import { Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-core';
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

**Prerequisites:**

1. Install the PostgreSQL storage package:

   ```bash
   npm install @dismissible/nestjs-postgres-storage
   ```

2. Set up your database connection string:

   ```env
   DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING=postgresql://user:password@localhost:5432/dismissible
   ```

3. Run Prisma migrations (if using Prisma):
   ```bash
   npx prisma migrate dev
   ```

The PostgreSQL adapter uses Prisma and automatically handles schema migrations. The storage persists all dismissible items across application restarts.

### Using the Service

Instead of using the built-in REST API endpoints, you can inject `DismissibleService` directly into your controllers or other services for more control:

```typescript
import { Controller, Get, Param, Delete, Post } from '@nestjs/common';
import { DismissibleService } from '@dismissible/nestjs-core';

@Controller('features')
export class FeaturesController {
  constructor(private readonly dismissibleService: DismissibleService) {}

  @Get(':userId/items/:itemId')
  async getOrCreateItem(@Param('userId') userId: string, @Param('itemId') itemId: string) {
    const result = await this.dismissibleService.getOrCreate(
      itemId,
      userId,
      undefined, // optional request context
    );

    return {
      item: result.item,
      wasCreated: result.created,
    };
  }

  @Delete(':userId/items/:itemId')
  async dismissItem(@Param('userId') userId: string, @Param('itemId') itemId: string) {
    const result = await this.dismissibleService.dismiss(itemId, userId);
    return { item: result.item };
  }

  @Post(':userId/items/:itemId/restore')
  async restoreItem(@Param('userId') userId: string, @Param('itemId') itemId: string) {
    const result = await this.dismissibleService.restore(itemId, userId);
    return { item: result.item };
  }
}
```

### JWT Authentication

Secure your API endpoints using the JWT Auth Hook with any OIDC-compliant identity provider:

```typescript
import { Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-core';
import { JwtAuthHookModule, JwtAuthHook } from '@dismissible/nestjs-jwt-auth-hook';

@Module({
  imports: [
    JwtAuthHookModule.forRoot({
      enabled: true,
      wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
      issuer: 'https://auth.example.com',
      audience: 'my-api',
    }),
    DismissibleModule.forRoot({
      hooks: [JwtAuthHook],
    }),
  ],
})
export class AppModule {}
```

See the [@dismissible/nestjs-jwt-auth-hook](https://www.npmjs.com/package/@dismissible/nestjs-jwt-auth-hook) package for detailed configuration options.

### Custom Lifecycle Hooks

Lifecycle hooks allow you to intercept operations and add custom logic, validation, or mutations:

```typescript
import { Injectable } from '@nestjs/common';
import { IDismissibleLifecycleHook, IHookResult } from '@dismissible/nestjs-core';
@Injectable()
export class AuditHook implements IDismissibleLifecycleHook {
  // Lower priority runs first (default is 0)
  readonly priority = 10;

  async onBeforeDismiss(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    // Block dismissal of critical items
    if (itemId.startsWith('critical-')) {
      return {
        proceed: false,
        reason: 'Cannot dismiss critical items',
      };
    }

    // Allow the operation to proceed
    return { proceed: true };
  }

  async onAfterCreate(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    // Log item creation for analytics
    console.log(`Item created: ${itemId} for user ${userId}`);
  }

  // Mutate item ID before operation
  async onBeforeGetOrCreate(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    // Normalize item IDs (e.g., lowercase)
    return {
      proceed: true,
      mutations: {
        id: itemId.toLowerCase(),
      },
    };
  }
}
```

Register hooks in your module:

```typescript
import { DismissibleModule } from '@dismissible/nestjs-core';
import { AuditHook } from './hooks/audit.hook';

@Module({
  imports: [
    DismissibleModule.forRoot({
      hooks: [AuditHook],
    }),
  ],
})
export class AppModule {}
```

### Listening to Events

The library emits events for all operations. Listen to them using NestJS's `EventEmitter2`:

```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ItemCreatedEvent,
  ItemDismissedEvent,
  ItemRestoredEvent,
  ItemRetrievedEvent,
  DismissibleEvents,
} from '@dismissible/nestjs-core';

@Injectable()
export class AnalyticsService {
  @OnEvent(DismissibleEvents.ITEM_CREATED)
  handleItemCreated(event: ItemCreatedEvent) {
    // Track item creation in analytics
    console.log(`Analytics: Item ${event.id} created for user ${event.userId}`);
  }

  @OnEvent(DismissibleEvents.ITEM_DISMISSED)
  handleItemDismissed(event: ItemDismissedEvent) {
    // Track dismissals
    console.log(`Analytics: Item ${event.id} dismissed by user ${event.userId}`);
  }

  @OnEvent(DismissibleEvents.ITEM_RESTORED)
  handleItemRestored(event: ItemRestoredEvent) {
    // Track restorations
    console.log(`Analytics: Item ${event.id} restored by user ${event.userId}`);
  }
}
```

### Custom Logger

Provide a custom logger implementation:

```typescript
import { Injectable } from '@nestjs/common';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';
import { DismissibleModule } from '@dismissible/nestjs-core';

@Injectable()
export class CustomLogger implements IDismissibleLogger {
  debug(message: string, context?: any) {
    // Your custom logging logic
    console.log(`[DEBUG] ${message}`, context);
  }

  info(message: string, context?: any) {
    console.log(`[INFO] ${message}`, context);
  }

  warn(message: string, context?: any) {
    console.warn(`[WARN] ${message}`, context);
  }

  error(message: string, context?: any) {
    console.error(`[ERROR] ${message}`, context);
  }
}

@Module({
  imports: [
    DismissibleModule.forRoot({
      logger: CustomLogger,
    }),
  ],
})
export class AppModule {}
```

## API Reference

### DismissibleService

The main service for interacting with dismissible items.

#### Methods

**`getOrCreate(itemId, userId, context?)`**

Retrieves an existing item or creates a new one if it doesn't exist.

- `itemId: string` - Unique identifier for the item
- `userId: string` - User identifier (required)
- `context?: IRequestContext` - Optional request context for tracing

Returns: `Promise<IGetOrCreateServiceResponse>`

**`dismiss(itemId, userId, context?)`**

Marks an item as dismissed.

- `itemId: string` - Item identifier
- `userId: string` - User identifier
- `context?: IRequestContext` - Optional request context

Returns: `Promise<IDismissServiceResponse>`

**`restore(itemId, userId, context?)`**

Restores a previously dismissed item.

- `itemId: string` - Item identifier
- `userId: string` - User identifier
- `context?: IRequestContext` - Optional request context

Returns: `Promise<IRestoreServiceResponse>`

### Module Configuration

```typescript
interface IDismissibleModuleOptions {
  // Custom storage module (defaults to memory storage)
  storage?: DynamicModule | Type<any>;

  // Custom logger implementation
  logger?: Type<IDismissibleLogger>;

  // Lifecycle hooks to register
  hooks?: Type<IDismissibleLifecycleHook>[];
}
```

## Events

The library emits the following events:

- `DismissibleEvents.ITEM_CREATED` - Emitted when a new item is created
- `DismissibleEvents.ITEM_RETRIEVED` - Emitted when an existing item is retrieved
- `DismissibleEvents.ITEM_DISMISSED` - Emitted when an item is dismissed
- `DismissibleEvents.ITEM_RESTORED` - Emitted when an item is restored

All events include:

- `id: string` - The item identifier
- `item: DismissibleItemDto` - The current item state
- `userId: string` - The user identifier
- `context?: IRequestContext` - Optional request context

Dismiss and restore events also include:

- `previousItem: DismissibleItemDto` - The item state before the operation

## Lifecycle Hooks

Hooks can implement any of the following methods:

- `onBeforeGetOrCreate()` - Called before get-or-create operation
- `onAfterGetOrCreate()` - Called after get-or-create operation
- `onBeforeCreate()` - Called before creating a new item
- `onAfterCreate()` - Called after creating a new item
- `onBeforeDismiss()` - Called before dismissing an item
- `onAfterDismiss()` - Called after dismissing an item
- `onBeforeRestore()` - Called before restoring an item
- `onAfterRestore()` - Called after restoring an item

Hooks can:

- **Block operations** by returning `{ proceed: false, reason: string }`
- **Mutate parameters** by returning `{ proceed: true, mutations: { id?, userId?, context? } }`
- **Perform side effects** in post-hooks (no return value needed)

Hooks are executed in priority order (lower numbers first).

## Storage Adapters

### In-Memory Storage (Default)

The default storage adapter stores items in memory. Data is lost on application restart.

### PostgreSQL Storage

Use `PostgresStorageModule` for persistent storage. See the [Using PostgreSQL Storage](#using-postgresql-storage) section above.

### Custom Storage Adapter

Implement the `IDismissibleStorage` interface to create a custom storage adapter:

```typescript
import { Injectable } from '@nestjs/common';
import { IDismissibleStorage } from '@dismissible/nestjs-storage';
import { DismissibleItemDto } from '@dismissible/nestjs-item';

@Injectable()
export class RedisStorageAdapter implements IDismissibleStorage {
  async get(userId: string, itemId: string): Promise<DismissibleItemDto | null> {
    // Your implementation
  }

  async create(userId: string, item: DismissibleItemDto): Promise<void> {
    // Your implementation
  }

  async update(userId: string, item: DismissibleItemDto): Promise<void> {
    // Your implementation
  }
}
```

## License

MIT
