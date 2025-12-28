# @dismissible/nestjs-api

Dismissible API - A NestJS application that maintains dismissal state for UI elements and provides a REST API for managing dismissible items.

> **Part of the Dismissible API** - This library is part of the [Dismissible API](https://dismissible.io) ecosystem. Visit [dismissible.io](https://dismissible.io) for more information and documentation.

## Overview

Dismissible manages the state of your UI elements across sessions, so your users see what matters, once! No more onboarding messages reappearing on every tab, no more notifications haunting users across devices. This API:

- Maintains all the dismissal state for dismissible items
- Provides a REST API for managing dismissible items (get, dismiss, restore)
- Supports JWT authentication via OIDC-compliant identity providers
- Uses PostgreSQL for persistent storage
- Includes comprehensive security features (Helmet, CORS, validation)

## Installation

```bash
npm install @dismissible/nestjs-api
```

## Usage

### Standalone Application

Create an entry point that uses the DismissibleNestFactory:

```typescript
// src/main.ts
import { DismissibleNestFactory } from '@dismissible/nestjs-api';

async function bootstrap() {
  const app = await DismissibleNestFactory.create();
  await app.start();
}

bootstrap();
```

### NestJS Module

Import the DismissibleModule into your existing NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-api';
import { PostgresStorageModule } from '@dismissible/nestjs-postgres-storage';

@Module({
  imports: [
    DismissibleModule.forRoot({
      storage: PostgresStorageModule.forRoot({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  ],
})
export class AppModule {}
```

### With Additional Imports

You can pass additional imports to the factory or module:

```typescript
import { DismissibleNestFactory } from '@dismissible/nestjs-api';
import { CustomModule } from './custom.module';

async function bootstrap() {
  const app = await DismissibleNestFactory.create({
    imports: [CustomModule],
  });
  await app.start();
}

bootstrap();
```

## API Endpoints

The API provides the following REST endpoints:

| Endpoint                            | Method | Description                         |
| ----------------------------------- | ------ | ----------------------------------- |
| `/health`                           | GET    | Health check endpoint               |
| `/v1/users/{userId}/items/{itemId}` | GET    | Get or create a dismissible item    |
| `/v1/users/{userId}/items/{itemId}` | DELETE | Dismiss an item                     |
| `/v1/users/{userId}/items/{itemId}` | POST   | Restore a previously dismissed item |

Enable Swagger documentation by setting `DISMISSIBLE_SWAGGER_ENABLED=true` and visit `/docs` for interactive API docs.

## Configuration

The API can be configured using either environment variables or a YAML configuration file. Environment variables follow the pattern `DISMISSIBLE_{SECTION}_{KEY}` (e.g., `DISMISSIBLE_PORT`, `DISMISSIBLE_CORS_ENABLED`).

### Environment Variables

#### Server

| Variable           | Description             | Default |
| ------------------ | ----------------------- | ------- |
| `DISMISSIBLE_PORT` | Port the API listens on | `3001`  |

#### Swagger

When enabled, Swagger documentation is published to the path specified by `DISMISSIBLE_SWAGGER_PATH` (defaults to `/docs`). The OpenAPI schema is available at `${PATH}-json` (JSON format) and `${PATH}-yaml` (YAML format). For example:

- Default (`docs`): `/docs`, `/docs-json`, `/docs-yaml`
- `swagger`: `/swagger`, `/swagger-json`, `/swagger-yaml`
- `swagger/docs`: `/swagger/docs`, `/swagger/docs-json`, `/swagger/docs-yaml`

| Variable                      | Description                       | Default  |
| ----------------------------- | --------------------------------- | -------- |
| `DISMISSIBLE_SWAGGER_ENABLED` | Enable Swagger documentation      | `false`  |
| `DISMISSIBLE_SWAGGER_PATH`    | Swagger documentation path prefix | `"docs"` |

#### Postgres Storage

| Variable                                         | Description                  | Default |
| ------------------------------------------------ | ---------------------------- | ------- |
| `DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING` | PostgreSQL connection string | `""`    |

#### Database Migrations

| Variable                    | Description                                             | Default |
| --------------------------- | ------------------------------------------------------- | ------- |
| `DISMISSIBLE_RUN_MIGRATION` | Run database migrations before starting the application | `false` |

#### JWT Authentication

Enable JWT authentication to secure your API endpoints with OIDC-compliant identity providers (Auth0, Okta, Keycloak, etc.):

| Variable                                   | Description                            | Default  |
| ------------------------------------------ | -------------------------------------- | -------- |
| `DISMISSIBLE_JWT_AUTH_ENABLED`             | Enable JWT authentication              | `false`  |
| `DISMISSIBLE_JWT_AUTH_WELL_KNOWN_URL`      | OIDC well-known URL for JWKS discovery | `""`     |
| `DISMISSIBLE_JWT_AUTH_ISSUER`              | Expected issuer claim (optional)       | `""`     |
| `DISMISSIBLE_JWT_AUTH_AUDIENCE`            | Expected audience claim (optional)     | `""`     |
| `DISMISSIBLE_JWT_AUTH_ALGORITHMS`          | Allowed algorithms (comma-separated)   | `RS256`  |
| `DISMISSIBLE_JWT_AUTH_JWKS_CACHE_DURATION` | JWKS cache duration in ms              | `600000` |
| `DISMISSIBLE_JWT_AUTH_REQUEST_TIMEOUT`     | Request timeout in ms                  | `30000`  |
| `DISMISSIBLE_JWT_AUTH_PRIORITY`            | Hook priority (lower runs first)       | `-100`   |

#### Helmet Security Headers

| Variable                                     | Description                         | Default    |
| -------------------------------------------- | ----------------------------------- | ---------- |
| `DISMISSIBLE_HELMET_ENABLED`                 | Enable Helmet security headers      | `true`     |
| `DISMISSIBLE_HELMET_CSP`                     | Enable Content Security Policy      | `true`     |
| `DISMISSIBLE_HELMET_COEP`                    | Enable Cross-Origin Embedder Policy | `true`     |
| `DISMISSIBLE_HELMET_HSTS_MAX_AGE`            | HSTS max age in seconds             | `31536000` |
| `DISMISSIBLE_HELMET_HSTS_INCLUDE_SUBDOMAINS` | Include subdomains in HSTS          | `true`     |
| `DISMISSIBLE_HELMET_HSTS_PRELOAD`            | Enable HSTS preload                 | `false`    |

#### CORS

| Variable                           | Description                            | Default                                   |
| ---------------------------------- | -------------------------------------- | ----------------------------------------- |
| `DISMISSIBLE_CORS_ENABLED`         | Enable CORS                            | `true`                                    |
| `DISMISSIBLE_CORS_ORIGINS`         | Allowed origins (comma-separated)      | `http://localhost:3000`                   |
| `DISMISSIBLE_CORS_METHODS`         | Allowed HTTP methods (comma-separated) | `GET,POST,DELETE,OPTIONS`                 |
| `DISMISSIBLE_CORS_ALLOWED_HEADERS` | Allowed headers (comma-separated)      | `Content-Type,Authorization,x-request-id` |
| `DISMISSIBLE_CORS_CREDENTIALS`     | Allow credentials                      | `true`                                    |
| `DISMISSIBLE_CORS_MAX_AGE`         | Preflight cache duration in seconds    | `86400`                                   |

#### Validation

Configure NestJS ValidationPipe behavior for request validation:

| Variable                                        | Description                           | Default |
| ----------------------------------------------- | ------------------------------------- | ------- |
| `DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES` | Disable detailed error messages       | `true`  |
| `DISMISSIBLE_VALIDATION_WHITELIST`              | Strip non-whitelisted properties      | `true`  |
| `DISMISSIBLE_VALIDATION_FORBID_NON_WHITELISTED` | Throw error for non-whitelisted props | `true`  |
| `DISMISSIBLE_VALIDATION_TRANSFORM`              | Automatically transform payloads      | `true`  |

> **Security Note**: Set `DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES=true` in production to prevent information disclosure through detailed validation error messages.

### YAML Configuration File

Instead of using environment variables, you can create a YAML configuration file. The API uses [nest-typed-config](https://www.npmjs.com/package/nest-typed-config), which autoloads configuration from YAML files into DTOs and makes them available via NestJS dependency injection.

Create a `.env.yaml` file in your config directory:

```yaml
# @api/config/.env.yaml
server:
  port: 3001
swagger:
  enabled: false
  path: ''
db:
  connectionString: 'postgresql://user:password@localhost:5432/dismissible'
jwtAuth:
  enabled: false
  wellKnownUrl: ''
  issuer: ''
  audience: ''
  algorithms:
    - 'RS256'
  jwksCacheDuration: 600000
  requestTimeout: 30000
  priority: -100
  verifyUserIdMatch: true
helmet:
  enabled: true
  contentSecurityPolicy: true
  crossOriginEmbedderPolicy: true
  hstsMaxAge: 31536000
  hstsIncludeSubDomains: true
  hstsPreload: false
cors:
  enabled: true
  origins:
    - 'http://localhost:3000'
    - 'http://localhost:5173'
  methods:
    - 'GET'
    - 'POST'
    - 'DELETE'
    - 'OPTIONS'
  allowedHeaders:
    - 'Content-Type'
    - 'Authorization'
    - 'x-request-id'
  credentials: true
  maxAge: 86400
validation:
  disableErrorMessages: true
  whitelist: true
  forbidNonWhitelisted: true
  transform: true
```

Then specify the config directory when creating the application:

```typescript
import { DismissibleNestFactory } from '@dismissible/nestjs-api';

async function bootstrap() {
  const app = await DismissibleNestFactory.create({
    configPath: './config', // Path to directory containing .env.yaml
  });
  await app.start();
}

bootstrap();
```

> **NOTE**: When using a YAML config file, ensure your build step copies the config directory to the output directory. For example, if using Nx, configure the `assets` property in your `project.json` to copy the config folder:
>
> ```json
> {
>   "build": {
>     "options": {
>       "assets": [
>         {
>           "input": "api/config",
>           "glob": "**/*.yaml",
>           "output": "config"
>         }
>       ]
>     }
>   }
> }
> ```

### Extending the Configuration

You can extend the default `AppConfig` with additional configuration options by creating your own config schema and passing it via the `schema` option. This is useful when you need custom settings beyond what's provided by default.

```typescript
// custom.config.ts
import { AppConfig } from '@dismissible/nestjs-api';
import { IsString, IsOptional } from 'class-validator';

export class CustomConfig extends AppConfig {
  @IsString()
  @IsOptional()
  myCustomSetting?: string;
}
```

```typescript
// src/main.ts
import { DismissibleNestFactory } from '@dismissible/nestjs-api';
import { CustomConfig } from './custom.config';

async function bootstrap() {
  const app = await DismissibleNestFactory.create({
    configPath: './config',
    schema: CustomConfig, // Pass your extended config schema
  });
  await app.start();
}

bootstrap();
```

Then add your custom settings to the YAML file:

```yaml
# @api/config/.env.yaml
server:
  port: 3001
myCustomSetting: 'custom-value'
# ... rest of default config
```

The nest-typed-config library will automatically merge your custom config with the defaults, and your custom config class will be available for injection throughout your NestJS application.

## Programmatic Configuration

### DismissibleNestFactory Options

```typescript
interface IDismissibleNestFactoryOptions {
  configPath?: string; // Path to config files
  schema?: new () => DefaultAppConfig; // Config validation schema
  logger?: Type<IDismissibleLogger>; // Custom logger implementation
  imports?: DynamicModule[]; // Additional modules to import
}
```

## Running the Application

### Development

```bash
# Start the API
npm run start

# Start with hot reload
npm run start:dev
```

### Docker

The fastest way to get started:

```bash
docker run -p 3001:3001 \
  -e DISMISSIBLE_RUN_MIGRATION=true \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://user:password@host:5432/dismissible" \
  dismissibleio/dismissible-api:latest
```

See [docs/DOCKER.md](../docs/DOCKER.md) for complete deployment instructions.

## Database Setup

**CRITICAL**: The database schema must be initialized before starting the API.

### Using Prisma Migrations

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (development)
npm run prisma:migrate:dev

# Deploy migrations (production)
npm run prisma:migrate:deploy

# Push schema (development only)
npm run prisma:db:push
```

## Features

- **REST API**: Clean, simple endpoints for managing dismissible items
- **JWT Authentication**: Secure your API with OIDC-compliant identity providers (Auth0, Okta, Keycloak)
- **PostgreSQL Storage**: Persistent storage using Prisma ORM
- **Swagger Documentation**: Interactive API docs when enabled
- **Security**: Helmet for security headers, CORS configuration, request validation
- **TypeScript**: Full TypeScript support with type safety
- **Docker Ready**: Multi-stage Dockerfile for production deployments

## Related Packages

- `@dismissible/nestjs-dismissible` - Main dismissible service and logic
- `@dismissible/nestjs-postgres-storage` - PostgreSQL storage adapter
- `@dismissible/nestjs-storage` - Storage interface definition
- `@dismissible/nestjs-logger` - Logging abstraction
- `@dismissible/nestjs-jwt-auth-hook` - JWT authentication hook
- `@dismissible/react-client` - React client for the Dismissible system

## License

MIT
