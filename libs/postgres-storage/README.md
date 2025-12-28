# @dismissible/nestjs-postgres-storage

PostgreSQL storage adapter for the Dismissible system using Prisma.

> **Part of the Dismissible API** - This library is part of the [Dismissible API](https://dismissible.io) ecosystem. Visit [dismissible.io](https://dismissible.io) for more information and documentation.

## Overview

This library provides a production-ready PostgreSQL storage adapter for the Dismissible system. It uses Prisma for database access and includes:

- Persistent storage of dismissible items
- Automatic database migrations via Prisma
- Connection pooling and lifecycle management
- Full TypeScript support

## Installation

```bash
npm install @dismissible/nestjs-postgres-storage
```

You'll also need to install the peer dependencies:

```bash
npm install @dismissible/nestjs-storage @dismissible/nestjs-dismissible-item @dismissible/nestjs-logger prisma
```

## Prerequisites

- PostgreSQL database (version 12 or higher)
- Node.js 18 or higher

## Getting Started

### 1. Database Setup

First, set up your PostgreSQL database connection string:

```env
DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING=postgresql://user:password@localhost:5432/dismissible
```

### 2. Initialize Database Schema

**CRITICAL**: You must initialize the database schema before using the storage module. The API will fail to start if the database tables don't exist.

#### Option A: Using the CLI Tool (Recommended)

The package includes a CLI helper that automatically uses the correct schema path:

```bash
# Step 1: Generate Prisma Client (required before migrations)
npx dismissible-prisma generate

# Step 2: Initialize the database schema
# For development (creates migration files):
npx dismissible-prisma migrate dev --name init

# For production (applies existing migrations):
npx dismissible-prisma migrate deploy
```

#### Option B: Using Prisma Directly

If you prefer using Prisma directly, specify the schema path:

```bash
# Generate Prisma client
npx prisma generate --schema=node_modules/@dismissible/nestjs-postgres-storage/prisma/schema.prisma

# For development: Create and apply migrations
npx prisma migrate dev --schema=node_modules/@dismissible/nestjs-postgres-storage/prisma/schema.prisma --name init

# For production: Apply existing migrations
npx prisma migrate deploy --schema=node_modules/@dismissible/nestjs-postgres-storage/prisma/schema.prisma
```

#### Quick Development Setup (Not for Production)

For rapid development, you can use `db push` (development only, may cause data loss):

```bash
# Generate client
npx dismissible-prisma generate

# Push schema without migrations
npx dismissible-prisma db push
```

> **Migration Commands Explained**:
>
> - `migrate dev` - Creates migration files and applies them (use when schema changes)
> - `migrate deploy` - Applies existing migrations (use in production, CI/CD, or fresh database setup)
> - `db push` - Syncs schema without migrations (development only, not version-controlled)
> - `generate` - Generates Prisma Client (required before using the storage module)

### 3. Module Configuration

Import and configure the module in your NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-dismissible';
import { PostgresStorageModule } from '@dismissible/nestjs-postgres-storage';
import { LoggerModule } from '@dismissible/nestjs-logger';

@Module({
  imports: [
    LoggerModule.forRoot({}),
    PostgresStorageModule.forRoot({
      connectionString: process.env.DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING!,
    }),
    DismissibleModule.forRoot({
      storage: PostgresStorageModule,
    }),
  ],
})
export class AppModule {}
```

### 4. Async Configuration

You can also configure the module asynchronously:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PostgresStorageModule } from '@dismissible/nestjs-postgres-storage';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PostgresStorageModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connectionString: config.get<string>('DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING')!,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## Database Schema

The library uses Prisma to manage the database schema. The schema includes:

- `DismissibleItem` table with fields:
  - `id` (String, primary key)
  - `userId` (String, indexed)
  - `createdAt` (DateTime)
  - `dismissedAt` (DateTime, nullable)
  - `metadata` (Json, nullable)

## API Reference

### PostgresStorageModule

#### `PostgresStorageModule.forRoot(options)`

Configures the PostgreSQL storage module synchronously.

**Options:**

- `connectionString: string` - PostgreSQL connection string

**Returns:** `DynamicModule`

#### `PostgresStorageModule.forRootAsync(options)`

Configures the PostgreSQL storage module asynchronously.

**Options:**

- `imports?: any[]` - Modules to import
- `useFactory: (deps) => PostgresStorageModuleOptions` - Factory function
- `inject?: any[]` - Dependencies to inject into the factory

**Returns:** `DynamicModule`

### PostgresStorageAdapter

The adapter implements `IDismissibleStorage` and provides:

- `get(userId, itemId)` - Retrieve an item
- `create(item)` - Create a new item
- `update(item)` - Update an existing item

### PrismaService

The service manages the Prisma client lifecycle:

- Automatically connects on module initialization
- Automatically disconnects on module destruction
- Uses connection pooling via `pg` adapter

## CLI Tool

The package includes a CLI tool for Prisma operations:

```bash
# Generate Prisma client
npx dismissible-prisma generate

# Run migrations
npx dismissible-prisma migrate dev

# Push schema (development)
npx dismissible-prisma db push

# View database
npx dismissible-prisma studio
```

The CLI automatically uses the bundled Prisma configuration, so you don't need to create your own `prisma.config.mjs` file.

## Prisma v7 Configuration

This package is compatible with Prisma v7+ which uses a configuration file (`prisma.config.ts` or `prisma.config.mjs`) for datasource configuration.

### Zero-Config Approach (Recommended)

Simply use the CLI tool - it handles all configuration automatically:

```bash
npx dismissible-prisma migrate dev
npx dismissible-prisma generate
```

### Custom Configuration

If you need to customize the Prisma configuration (e.g., add seeding), create your own `prisma.config.mjs` and import from this package:

```javascript
// prisma.config.mjs
import { defineConfig } from 'prisma/config';
import { basePrismaConfig } from '@dismissible/nestjs-postgres-storage';

export default defineConfig(basePrismaConfig);
```

### Extending the Configuration

You can extend the base configuration with additional options:

```javascript
// prisma.config.mjs
import { defineConfig } from 'prisma/config';
import { basePrismaConfig } from '@dismissible/nestjs-postgres-storage';

export default defineConfig({
  ...basePrismaConfig,
  migrations: {
    ...basePrismaConfig.migrations,
    seed: 'tsx prisma/seed.ts',
  },
});
```

### Programmatic Access

For advanced use cases, you can also use the config factory:

```typescript
import { createPrismaConfig, basePrismaConfig } from '@dismissible/nestjs-postgres-storage';

// Get the base config object
console.log(basePrismaConfig.schema);

// Or create a fresh config
const config = createPrismaConfig();
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (standard Prisma convention)
- `DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING` - Alternative PostgreSQL connection string (fallback if `DATABASE_URL` is not set)

## Production Considerations

1. **Connection Pooling**: The adapter uses `pg` connection pooling. Configure your pool size based on your application's needs.

2. **Migrations**: Always use Prisma migrations in production. Run migrations before starting your application:

   ```bash
   # Using the CLI helper (recommended)
   npx dismissible-prisma migrate deploy

   # Or using Prisma directly
   npx prisma migrate deploy --schema=node_modules/@dismissible/nestjs-postgres-storage/prisma/schema.prisma
   ```

   > **Critical**: The database schema must be initialized before your application starts. The storage adapter will fail if tables don't exist.

3. **Monitoring**: Monitor database connections and query performance.

4. **Backups**: Ensure regular database backups are in place.

## Related Packages

- `@dismissible/nestjs-dismissible` - Main dismissible service
- `@dismissible/nestjs-storage` - Storage interface
- `@dismissible/nestjs-dismissible-item` - Data models
- `@dismissible/nestjs-logger` - Logging

## License

MIT
