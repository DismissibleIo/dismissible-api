# Storage Adapters

This document explains the storage adapter pattern used in the Dismissible system, lists the available storage adapters, and provides guidance on creating custom adapters.

## Overview

The Dismissible system uses a **storage adapter pattern** to abstract persistence logic from the core application. This allows you to choose the storage backend that best fits your needs—whether that's in-memory storage for development, DynamoDB for serverless deployments, or PostgreSQL for traditional database setups.

All storage adapters implement the `IDismissibleStorage` interface and are injected via the `DISMISSIBLE_STORAGE_ADAPTER` token.

## Storage Interface

The `IDismissibleStorage` interface defines the contract that all storage adapters must implement:

```typescript
interface IDismissibleStorage {
  /**
   * Retrieve an item by user ID and item ID.
   * @returns The item or null if not found
   */
  get(userId: string, itemId: string): Promise<DismissibleItemDto | null>;

  /**
   * Create a new item.
   * @returns The created item
   */
  create(item: DismissibleItemDto): Promise<DismissibleItemDto>;

  /**
   * Update an existing item.
   * @returns The updated item
   */
  update(item: DismissibleItemDto): Promise<DismissibleItemDto>;

  /**
   * Delete an item by user ID and item ID.
   */
  delete(userId: string, itemId: string): Promise<void>;

  /**
   * Delete all items. Useful for cleanup operations.
   */
  deleteAll(): Promise<void>;
}
```

### Data Model

The `DismissibleItemDto` represents a dismissible item:

| Field         | Type     | Description                                                |
| ------------- | -------- | ---------------------------------------------------------- |
| `id`          | `string` | Unique identifier for the item (e.g., `welcome-banner-v2`) |
| `userId`      | `string` | User identifier who owns the item                          |
| `createdAt`   | `Date`   | When the item was created                                  |
| `dismissedAt` | `Date?`  | When the item was dismissed (optional)                     |

## Available Storage Adapters

### Memory Storage Adapter

**Package:** `@dismissible/nestjs-storage`

An in-memory storage implementation using an LRU (Least Recently Used) cache. Suitable for development and testing only—data is lost when the application restarts.

#### Configuration

| Property   | Required | Description                                     | Default    |
| ---------- | -------- | ----------------------------------------------- | ---------- |
| `maxItems` | No       | Maximum number of items to store (LRU eviction) | `5000`     |
| `ttlMs`    | No       | Time-to-live in milliseconds                    | `21600000` |

#### Environment Variables

| Variable                               | Description                      | Default    |
| -------------------------------------- | -------------------------------- | ---------- |
| `DISMISSIBLE_STORAGE_MEMORY_MAX_ITEMS` | Maximum number of items to store | `5000`     |
| `DISMISSIBLE_STORAGE_MEMORY_TTL_MS`    | Time-to-live in milliseconds     | `21600000` |

#### Usage

**Static configuration:**

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
      config: {
        maxItems: 10000,
        ttlMs: 43200000, // 12 hours
      },
    }),
  ],
})
export class AppModule {}
```

**Using environment variables (via YAML config):**

```yaml
storage:
  type: memory
  memory:
    maxItems: ${DISMISSIBLE_STORAGE_MEMORY_MAX_ITEMS:-5000}
    ttlMs: ${DISMISSIBLE_STORAGE_MEMORY_TTL_MS:-21600000}
```

> **Warning:** Do not use the memory adapter in production. Data will be lost on restart and is not shared across multiple instances.

---

### DynamoDB Storage Adapter

**Package:** `@dismissible/nestjs-dynamodb-storage`

A production-ready storage adapter for AWS DynamoDB. Ideal for serverless deployments and applications requiring high scalability.

#### Configuration

| Property          | Required | Description                                                            |
| ----------------- | -------- | ---------------------------------------------------------------------- |
| `tableName`       | Yes      | Name of the DynamoDB table                                             |
| `region`          | No       | AWS region (default: `us-east-1`)                                      |
| `endpoint`        | No       | Custom endpoint URL (useful for local development with DynamoDB Local) |
| `accessKeyId`     | No       | AWS access key ID (uses default credential chain if not provided)      |
| `secretAccessKey` | No       | AWS secret access key                                                  |
| `sessionToken`    | No       | AWS session token (for temporary credentials)                          |

#### Usage

**Static configuration:**

```typescript
import { Module } from '@nestjs/common';
import { DynamoDBStorageModule } from '@dismissible/nestjs-dynamodb-storage';
import { LoggerModule } from '@dismissible/nestjs-logger';

@Module({
  imports: [
    LoggerModule.forRoot({}),
    DynamoDBStorageModule.forRoot({
      tableName: 'dismissible-items',
      region: 'us-west-2',
    }),
  ],
})
export class AppModule {}
```

**Async configuration (with ConfigService):**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DynamoDBStorageModule } from '@dismissible/nestjs-dynamodb-storage';
import { LoggerModule } from '@dismissible/nestjs-logger';

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule.forRoot({}),
    DynamoDBStorageModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        tableName: config.getOrThrow('DYNAMODB_TABLE_NAME'),
        region: config.get('AWS_REGION'),
        endpoint: config.get('DYNAMODB_ENDPOINT'),
      }),
    }),
  ],
})
export class AppModule {}
```

#### DynamoDB Table Schema

Create your DynamoDB table with the following schema:

| Attribute     | Type   | Key Type             |
| ------------- | ------ | -------------------- |
| `userId`      | String | Partition Key (HASH) |
| `id`          | String | Sort Key (RANGE)     |
| `createdAt`   | String | -                    |
| `dismissedAt` | String | -                    |

**AWS CLI Example:**

```bash
aws dynamodb create-table \
  --table-name dismissible-items \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=id,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=id,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

**CloudFormation/Terraform Schema:**

```yaml
# CloudFormation
DismissibleItemsTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: dismissible-items
    BillingMode: PAY_PER_REQUEST
    AttributeDefinitions:
      - AttributeName: userId
        AttributeType: S
      - AttributeName: id
        AttributeType: S
    KeySchema:
      - AttributeName: userId
        KeyType: HASH
      - AttributeName: id
        KeyType: RANGE
```

---

### PostgreSQL Storage Adapter

**Package:** `@dismissible/nestjs-postgres-storage`

A production-ready storage adapter for PostgreSQL using Prisma ORM. Ideal for applications already using PostgreSQL or requiring relational database features.

#### Configuration

| Property           | Required | Description                  |
| ------------------ | -------- | ---------------------------- |
| `connectionString` | Yes      | PostgreSQL connection string |

#### Usage

**Static configuration:**

```typescript
import { Module } from '@nestjs/common';
import { PostgresStorageModule } from '@dismissible/nestjs-postgres-storage';
import { LoggerModule } from '@dismissible/nestjs-logger';

@Module({
  imports: [
    LoggerModule.forRoot({}),
    PostgresStorageModule.forRoot({
      connectionString: 'postgresql://user:password@localhost:5432/dismissible',
    }),
  ],
})
export class AppModule {}
```

**Async configuration (with ConfigService):**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PostgresStorageModule } from '@dismissible/nestjs-postgres-storage';
import { LoggerModule } from '@dismissible/nestjs-logger';

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule.forRoot({}),
    PostgresStorageModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connectionString: config.getOrThrow('DATABASE_URL'),
      }),
    }),
  ],
})
export class AppModule {}
```

#### PostgreSQL Schema

Create the following table in your PostgreSQL database:

```sql
CREATE TABLE dismissible_items (
  id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (user_id, id)
);

CREATE INDEX idx_dismissible_items_user_id ON dismissible_items(user_id);
```

The composite primary key `(user_id, id)` ensures uniqueness per user-item combination and optimizes lookups.

---

## Creating a Custom Storage Adapter

You can create your own storage adapter to integrate with any persistence layer (e.g., Redis, MongoDB, SQLite, etc.).

### Step 1: Implement the Interface

Create a class that implements `IDismissibleStorage`:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { IDismissibleStorage } from '@dismissible/nestjs-storage';
import { DismissibleItemDto, DismissibleItemFactory } from '@dismissible/nestjs-item';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';

@Injectable()
export class MyCustomStorageAdapter implements IDismissibleStorage {
  constructor(
    @Inject(DISMISSIBLE_LOGGER) private readonly logger: IDismissibleLogger,
    private readonly itemFactory: DismissibleItemFactory,
  ) {}

  async get(userId: string, itemId: string): Promise<DismissibleItemDto | null> {
    this.logger.debug('Custom storage get', { userId, itemId });

    // Your implementation: fetch from your storage backend
    const record = await this.fetchFromStorage(userId, itemId);

    if (!record) {
      return null;
    }

    // Use the factory to create DTOs
    return this.itemFactory.create({
      id: record.id,
      userId: record.userId,
      createdAt: new Date(record.createdAt),
      dismissedAt: record.dismissedAt ? new Date(record.dismissedAt) : undefined,
    });
  }

  async create(item: DismissibleItemDto): Promise<DismissibleItemDto> {
    this.logger.debug('Custom storage create', { userId: item.userId, itemId: item.id });

    // Your implementation: save to your storage backend
    await this.saveToStorage({
      id: item.id,
      userId: item.userId,
      createdAt: item.createdAt.toISOString(),
      dismissedAt: item.dismissedAt?.toISOString() ?? null,
    });

    return item;
  }

  async update(item: DismissibleItemDto): Promise<DismissibleItemDto> {
    this.logger.debug('Custom storage update', { userId: item.userId, itemId: item.id });

    // Your implementation: update in your storage backend
    await this.updateInStorage(item.userId, item.id, {
      dismissedAt: item.dismissedAt?.toISOString() ?? null,
    });

    return item;
  }

  async delete(userId: string, itemId: string): Promise<void> {
    this.logger.debug('Custom storage delete', { userId, itemId });

    // Your implementation: delete from your storage backend
    await this.deleteFromStorage(userId, itemId);
  }

  async deleteAll(): Promise<void> {
    this.logger.debug('Custom storage deleteAll');

    // Your implementation: delete all items
    await this.clearStorage();
  }

  // Your private methods for storage operations
  private async fetchFromStorage(userId: string, itemId: string): Promise<any> {
    // Implementation details...
  }

  private async saveToStorage(record: any): Promise<void> {
    // Implementation details...
  }

  private async updateInStorage(userId: string, itemId: string, data: any): Promise<void> {
    // Implementation details...
  }

  private async deleteFromStorage(userId: string, itemId: string): Promise<void> {
    // Implementation details...
  }

  private async clearStorage(): Promise<void> {
    // Implementation details...
  }
}
```

### Step 2: Create a Configuration Class (Optional)

If your adapter requires configuration:

```typescript
import { IsString, IsNumber, IsOptional } from 'class-validator';

export const MY_CUSTOM_STORAGE_CONFIG = Symbol('MY_CUSTOM_STORAGE_CONFIG');

export class MyCustomStorageConfig {
  @IsString()
  public readonly host!: string;

  @IsNumber()
  @IsOptional()
  public readonly port?: number;
}
```

### Step 3: Create a Module

Create a NestJS module that provides your adapter:

```typescript
import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { DISMISSIBLE_STORAGE_ADAPTER } from '@dismissible/nestjs-storage';
import { DismissibleItemModule } from '@dismissible/nestjs-item';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import { MyCustomStorageAdapter } from './my-custom-storage.adapter';
import { MyCustomStorageConfig, MY_CUSTOM_STORAGE_CONFIG } from './my-custom-storage.config';

export interface MyCustomStorageModuleOptions {
  host: string;
  port?: number;
}

export interface MyCustomStorageModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useFactory: (
    ...args: any[]
  ) => MyCustomStorageModuleOptions | Promise<MyCustomStorageModuleOptions>;
}

@Module({})
export class MyCustomStorageModule {
  static forRoot(options: MyCustomStorageModuleOptions): DynamicModule {
    return {
      module: MyCustomStorageModule,
      imports: [DismissibleItemModule],
      providers: [
        {
          provide: MY_CUSTOM_STORAGE_CONFIG,
          useValue: options,
        },
        MyCustomStorageAdapter,
        {
          provide: DISMISSIBLE_STORAGE_ADAPTER,
          useExisting: MyCustomStorageAdapter,
        },
      ],
      exports: [DISMISSIBLE_STORAGE_ADAPTER],
    };
  }

  static forRootAsync(options: MyCustomStorageModuleAsyncOptions): DynamicModule {
    return {
      module: MyCustomStorageModule,
      imports: [...(options.imports || []), DismissibleItemModule],
      providers: [
        {
          provide: MY_CUSTOM_STORAGE_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        MyCustomStorageAdapter,
        {
          provide: DISMISSIBLE_STORAGE_ADAPTER,
          useExisting: MyCustomStorageAdapter,
        },
      ],
      exports: [DISMISSIBLE_STORAGE_ADAPTER],
    };
  }
}
```

### Step 4: Use Your Custom Adapter

```typescript
import { Module } from '@nestjs/common';
import { MyCustomStorageModule } from './my-custom-storage.module';
import { LoggerModule } from '@dismissible/nestjs-logger';

@Module({
  imports: [
    LoggerModule.forRoot({}),
    MyCustomStorageModule.forRoot({
      host: 'localhost',
      port: 6379,
    }),
  ],
})
export class AppModule {}
```

## Related Documentation

- [Configuration Guide](./CONFIGURATION.md) - Environment variables and configuration options
- [Local Development](./LOCAL_DEV.md) - Setting up a local development environment
- [Docker Guide](./DOCKER.md) - Running with Docker
