<p align="center">
  <a href="https://dismissible.io" target="_blank"><img src="https://raw.githubusercontent.com/DismissibleIo/dismissible-api/main/docs/images/dismissible_logo.png" width="240" alt="Dismissible" /></a>
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

The core NestJS library for managing dismissible state in your applications. This is the central package that ties together all the main Dismissible libraries and contains the domain logic for dismissible items.

Perfect for guided tours, user preferences, onboarding flows, and any scenario where you need to track whether a user has dismissed or interacted with specific items.

> **Part of the Dismissible API** - This library is part of the [Dismissible API](https://dismissible.io) ecosystem. Visit [dismissible.io](https://dismissible.io) for more information and documentation.

## Related Packages

This core library integrates with several lower-level packages:

| Package                                                                                                      | Description                                  |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| [@dismissible/nestjs-storage](https://www.npmjs.com/package/@dismissible/nestjs-storage)                     | Storage interfaces and base module           |
| [@dismissible/nestjs-postgres-storage](https://www.npmjs.com/package/@dismissible/nestjs-postgres-storage)   | PostgreSQL storage adapter                   |
| [@dismissible/nestjs-dynamodb-storage](https://www.npmjs.com/package/@dismissible/nestjs-dynamodb-storage)   | DynamoDB storage adapter                     |
| [@dismissible/nestjs-hooks](https://www.npmjs.com/package/@dismissible/nestjs-hooks)                         | Lifecycle hook interfaces                    |
| [@dismissible/nestjs-jwt-auth-hook](https://www.npmjs.com/package/@dismissible/nestjs-jwt-auth-hook)         | JWT authentication hook                      |
| [@dismissible/nestjs-rate-limiter-hook](https://www.npmjs.com/package/@dismissible/nestjs-rate-limiter-hook) | Rate limiting hook                           |
| [@dismissible/nestjs-logger](https://www.npmjs.com/package/@dismissible/nestjs-logger)                       | Logger interfaces and default implementation |
| [@dismissible/nestjs-item](https://www.npmjs.com/package/@dismissible/nestjs-item)                           | Dismissible item DTOs and types              |
| [@dismissible/react-client](https://www.npmjs.com/package/@dismissible/react-client)                         | React client for frontend integration        |

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
  imports: [DismissibleModule.forRoot()],
})
export class AppModule {}
```

### Built-in REST API

The module automatically registers REST endpoints for all operations:

- `GET /v1/users/:userId/items/:itemId` - Get or create an item
- `DELETE /v1/users/:userId/items/:itemId` - Dismiss an item
- `POST /v1/users/:userId/items/:itemId` - Restore a dismissed item
- `POST /v1/users/:userId/items` - Batch get or create multiple items (max 50)

Example request:

```bash
# Get or create an item
curl http://localhost:3000/v1/users/user-123/items/welcome-banner

# Dismiss an item
curl -X DELETE http://localhost:3000/v1/users/user-123/items/welcome-banner

# Restore a dismissed item
curl -X POST http://localhost:3000/v1/users/user-123/items/welcome-banner

# Batch get or create multiple items
curl -X POST http://localhost:3000/v1/users/user-123/items \
  -H "Content-Type: application/json" \
  -d '{"items": ["welcome-banner", "onboarding-tip-1", "feature-announcement"]}'
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

#### Automatic Request Batching

When multiple `useDismissible` hooks are rendered on the same page, the React client automatically batches them into a single API request. This optimization reduces network overhead and improves performance, especially for pages with many dismissible components.

For example, if your page renders components using `useDismissible('welcome-banner')`, `useDismissible('onboarding-tip')`, and `useDismissible('feature-announcement')`, the client will automatically combine these into a single batch request to the `POST /v1/users/:userId/items` endpoint instead of making three separate API calls.

The batch endpoint supports up to **50 items per request**. If more than 50 items are requested, the client will split them into multiple batch requests automatically.

## Configuration Options

All configuration is done through `DismissibleModule.forRoot()`. The following options are available:

```typescript
interface IDismissibleModuleOptions {
  // Custom storage module (defaults to memory storage)
  storage?: Type<any> | DynamicModule;

  // Custom logger implementation
  logger?: Type<IDismissibleLogger>;

  // Lifecycle hooks to register
  hooks?: Type<IDismissibleLifecycleHook>[];

  // Additional modules to import
  imports?: DynamicModule[];

  // Additional providers to register
  providers?: Provider[];

  // Custom controllers (overrides default REST API controllers)
  controllers?: Type<any>[];
}
```

---

### `storage`

Specifies a custom storage module for persisting dismissible items. Defaults to in-memory storage.

**Default:** In-memory storage (data lost on restart)

```typescript
import { Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-core';
import { PostgresStorageModule } from '@dismissible/nestjs-postgres-storage';

@Module({
  imports: [
    DismissibleModule.forRoot({
      storage: PostgresStorageModule.forRoot({
        connectionString: 'postgresql://user:password@localhost:5432/dismissible',
      }),
    }),
  ],
})
export class AppModule {}
```

**Related packages:**

- [@dismissible/nestjs-storage](https://www.npmjs.com/package/@dismissible/nestjs-storage) - Storage interfaces and base module for implementing custom adapters
- [@dismissible/nestjs-postgres-storage](https://www.npmjs.com/package/@dismissible/nestjs-postgres-storage) - PostgreSQL storage adapter
- [@dismissible/nestjs-dynamodb-storage](https://www.npmjs.com/package/@dismissible/nestjs-dynamodb-storage) - DynamoDB storage adapter

---

### `logger`

Provides a custom logger implementation. The logger must implement the `IDismissibleLogger` interface.

**Default:** Built-in console logger

```typescript
import { Injectable, Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-core';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';

@Injectable()
class CustomLogger implements IDismissibleLogger {
  debug(message: string, context?: any) {
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

**Related packages:**

- [@dismissible/nestjs-logger](https://www.npmjs.com/package/@dismissible/nestjs-logger) - Logger interfaces and default implementation

---

### `hooks`

Registers lifecycle hooks that intercept operations. Hooks can block operations, mutate parameters, or perform side effects.

**Default:** No hooks

```typescript
import { Injectable, Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-core';
import { IDismissibleLifecycleHook, IHookResult } from '@dismissible/nestjs-hooks';

@Injectable()
class AuditHook implements IDismissibleLifecycleHook {
  readonly priority = 10; // Lower runs first

  async onAfterDismiss(itemId: string, userId: string): Promise<void> {
    console.log(`User ${userId} dismissed ${itemId}`);
  }
}

@Module({
  imports: [
    DismissibleModule.forRoot({
      hooks: [AuditHook],
    }),
  ],
})
export class AppModule {}
```

For JWT authentication, use the [@dismissible/nestjs-jwt-auth-hook](https://www.npmjs.com/package/@dismissible/nestjs-jwt-auth-hook) package:

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

**Related packages:**

- [@dismissible/nestjs-hooks](https://www.npmjs.com/package/@dismissible/nestjs-hooks) - Hook interfaces and types for implementing custom lifecycle hooks
- [@dismissible/nestjs-jwt-auth-hook](https://www.npmjs.com/package/@dismissible/nestjs-jwt-auth-hook) - JWT authentication hook for OIDC providers
- [@dismissible/nestjs-rate-limiter-hook](https://www.npmjs.com/package/@dismissible/nestjs-rate-limiter-hook) - Rate limiting hook

---

### `imports`

Adds additional modules to the DismissibleModule's imports. Useful for injecting dependencies that your hooks or providers need.

**Default:** None

```typescript
import { Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-core';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    DismissibleModule.forRoot({
      imports: [HttpModule],
      hooks: [WebhookHook], // Hook that uses HttpService
    }),
  ],
})
export class AppModule {}
```

---

### `providers`

Registers additional providers within the DismissibleModule. Useful for services that your hooks depend on.

**Default:** None

```typescript
import { Injectable, Module } from '@nestjs/common';
import { DismissibleModule, IDismissibleLifecycleHook } from '@dismissible/nestjs-core';

@Injectable()
class AnalyticsService {
  track(event: string, data: any) {
    // Send to analytics
  }
}

@Injectable()
class AnalyticsHook implements IDismissibleLifecycleHook {
  constructor(private analytics: AnalyticsService) {}

  async onAfterDismiss(itemId: string, userId: string): Promise<void> {
    this.analytics.track('item_dismissed', { itemId, userId });
  }
}

@Module({
  imports: [
    DismissibleModule.forRoot({
      providers: [AnalyticsService],
      hooks: [AnalyticsHook],
    }),
  ],
})
export class AppModule {}
```

---

### `controllers`

Overrides the default REST API controllers. Use this when you want complete control over the API endpoints.

**Default:** Built-in controllers for get-or-create, dismiss, and restore

```typescript
import { Controller, Get, Param, Module, Inject } from '@nestjs/common';
import {
  DismissibleModule,
  IDismissibleService,
  DISMISSIBLE_SERVICE,
} from '@dismissible/nestjs-core';

@Controller('custom')
class CustomController {
  constructor(
    @Inject(DISMISSIBLE_SERVICE)
    private dismissibleService: IDismissibleService,
  ) {}

  @Get(':userId/:itemId')
  async getItem(@Param('userId') userId: string, @Param('itemId') itemId: string) {
    return this.dismissibleService.getOrCreate(itemId, userId);
  }
}

@Module({
  imports: [
    DismissibleModule.forRoot({
      controllers: [CustomController],
    }),
  ],
})
export class AppModule {}
```

To disable the REST API entirely, pass an empty array:

```typescript
@Module({
  imports: [
    DismissibleModule.forRoot({
      controllers: [],
    }),
  ],
})
export class AppModule {}
```

---

## Using the Service Directly

Instead of using the built-in REST API, you can inject `DismissibleService` into your own controllers or services:

```typescript
import { Controller, Get, Param, Delete, Post, Inject } from '@nestjs/common';
import { IDismissibleService, DISMISSIBLE_SERVICE } from '@dismissible/nestjs-core';

@Controller('features')
export class FeaturesController {
  constructor(
    @Inject(DISMISSIBLE_SERVICE)
    private readonly dismissibleService: IDismissibleService,
  ) {}

  @Get(':userId/items/:itemId')
  async getOrCreateItem(@Param('userId') userId: string, @Param('itemId') itemId: string) {
    const result = await this.dismissibleService.getOrCreate(itemId, userId);
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

  @Post(':userId/items')
  async batchGetOrCreate(@Param('userId') userId: string, @Body() body: { items: string[] }) {
    const result = await this.dismissibleService.batchGetOrCreate(body.items, userId);
    return { items: result.items };
  }
}
```

## Events

The library emits events for all operations using NestJS's EventEmitter2:

```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ItemCreatedEvent,
  ItemDismissedEvent,
  ItemRestoredEvent,
  DismissibleEvents,
} from '@dismissible/nestjs-core';

@Injectable()
export class AnalyticsService {
  @OnEvent(DismissibleEvents.ITEM_CREATED)
  handleItemCreated(event: ItemCreatedEvent) {
    console.log(`Item ${event.id} created for user ${event.userId}`);
  }

  @OnEvent(DismissibleEvents.ITEM_DISMISSED)
  handleItemDismissed(event: ItemDismissedEvent) {
    console.log(`Item ${event.id} dismissed by user ${event.userId}`);
  }

  @OnEvent(DismissibleEvents.ITEM_RESTORED)
  handleItemRestored(event: ItemRestoredEvent) {
    console.log(`Item ${event.id} restored by user ${event.userId}`);
  }
}
```

Available events:

- `DismissibleEvents.ITEM_CREATED` - New item created
- `DismissibleEvents.ITEM_RETRIEVED` - Existing item retrieved
- `DismissibleEvents.ITEM_DISMISSED` - Item dismissed
- `DismissibleEvents.ITEM_RESTORED` - Item restored

## Overriding Services

All core services can be overridden using symbol-based dependency injection tokens. This allows you to provide custom implementations while maintaining type safety.

### Available Service Tokens

| Token                          | Interface                 | Description                                     |
| ------------------------------ | ------------------------- | ----------------------------------------------- |
| `DISMISSIBLE_SERVICE`          | `IDismissibleService`     | Main orchestration service                      |
| `DISMISSIBLE_CORE_SERVICE`     | `IDismissibleCoreService` | Core business logic service                     |
| `DISMISSIBLE_HOOK_RUNNER`      | `IHookRunner`             | Lifecycle hook execution                        |
| `DISMISSIBLE_HELPER`           | `IDismissibleHelper`      | Helper utilities                                |
| `DISMISSIBLE_DATE_SERVICE`     | `IDateService`            | Date operations                                 |
| `DISMISSIBLE_RESPONSE_SERVICE` | `IResponseService`        | HTTP response formatting                        |
| `DISMISSIBLE_ITEM_MAPPER`      | `IDismissibleItemMapper`  | Domain to DTO mapping                           |
| `DISMISSIBLE_ITEM_FACTORY`     | `IDismissibleItemFactory` | Item creation (from `@dismissible/nestjs-item`) |

### Example: Overriding the Date Service

Override the date service to control time in tests or add custom behavior:

```typescript
import { Injectable, Module } from '@nestjs/common';
import {
  DismissibleModule,
  IDateService,
  DISMISSIBLE_DATE_SERVICE,
} from '@dismissible/nestjs-core';

@Injectable()
class CustomDateService implements IDateService {
  getNow(): Date {
    // Custom implementation - e.g., use a fixed time for testing
    return new Date('2024-01-01T00:00:00.000Z');
  }

  parseIso(isoString: string): Date {
    return new Date(isoString);
  }

  toIso(date: Date): string {
    return date.toISOString();
  }
}

@Module({
  imports: [
    DismissibleModule.forRoot({
      providers: [
        CustomDateService,
        { provide: DISMISSIBLE_DATE_SERVICE, useExisting: CustomDateService },
      ],
    }),
  ],
})
export class AppModule {}
```

### Example: Overriding the Main Service

Override the main dismissible service for custom orchestration logic:

```typescript
import { Injectable, Inject, Module } from '@nestjs/common';
import {
  DismissibleModule,
  IDismissibleService,
  IDismissibleCoreService,
  DISMISSIBLE_SERVICE,
  DISMISSIBLE_CORE_SERVICE,
  IGetOrCreateServiceResponse,
  IDismissServiceResponse,
  IRestoreServiceResponse,
} from '@dismissible/nestjs-core';
import { IRequestContext } from '@dismissible/nestjs-request';

@Injectable()
class CustomDismissibleService implements IDismissibleService {
  constructor(
    @Inject(DISMISSIBLE_CORE_SERVICE)
    private readonly coreService: IDismissibleCoreService,
  ) {}

  async getOrCreate(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IGetOrCreateServiceResponse> {
    // Add custom logic before/after core operation
    console.log('Custom getOrCreate called');
    return this.coreService.getOrCreate(itemId, userId);
  }

  async dismiss(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IDismissServiceResponse> {
    return this.coreService.dismiss(itemId, userId);
  }

  async restore(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IRestoreServiceResponse> {
    return this.coreService.restore(itemId, userId);
  }
}

@Module({
  imports: [
    DismissibleModule.forRoot({
      providers: [
        CustomDismissibleService,
        { provide: DISMISSIBLE_SERVICE, useExisting: CustomDismissibleService },
      ],
    }),
  ],
})
export class AppModule {}
```

### Example: Overriding the Item Factory

Override the item factory to customize how items are created:

```typescript
import { Injectable, Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-core';
import {
  DismissibleItemDto,
  IDismissibleItemFactory,
  ICreateDismissibleItemOptions,
  DISMISSIBLE_ITEM_FACTORY,
} from '@dismissible/nestjs-item';

@Injectable()
class CustomItemFactory implements IDismissibleItemFactory {
  create(options: ICreateDismissibleItemOptions): DismissibleItemDto {
    const item = new DismissibleItemDto();
    item.id = options.id;
    item.userId = options.userId;
    item.createdAt = options.createdAt;
    item.dismissedAt = options.dismissedAt;
    return item;
  }

  clone(item: DismissibleItemDto): DismissibleItemDto {
    return this.create({
      id: item.id,
      createdAt: item.createdAt,
      userId: item.userId,
      dismissedAt: item.dismissedAt,
    });
  }

  createDismissed(item: DismissibleItemDto, dismissedAt: Date): DismissibleItemDto {
    return this.create({
      id: item.id,
      createdAt: item.createdAt,
      userId: item.userId,
      dismissedAt,
    });
  }

  createRestored(item: DismissibleItemDto): DismissibleItemDto {
    return this.create({
      id: item.id,
      createdAt: item.createdAt,
      userId: item.userId,
      dismissedAt: undefined,
    });
  }
}

@Module({
  imports: [
    DismissibleModule.forRoot({
      providers: [
        CustomItemFactory,
        { provide: DISMISSIBLE_ITEM_FACTORY, useExisting: CustomItemFactory },
      ],
    }),
  ],
})
export class AppModule {}
```

### Injecting Overridable Services

When injecting these services in your own code, use the symbol tokens for maximum flexibility:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { IDismissibleService, DISMISSIBLE_SERVICE } from '@dismissible/nestjs-core';

@Injectable()
export class MyService {
  constructor(
    @Inject(DISMISSIBLE_SERVICE)
    private readonly dismissibleService: IDismissibleService,
  ) {}

  async myMethod(userId: string, itemId: string) {
    // Your custom implementation will be injected if you've overridden it
    return this.dismissibleService.getOrCreate(itemId, userId);
  }
}
```

## License

MIT
