<p align="center">
  <a href="https://dismissible.io" target="_blank"><img src="https://raw.githubusercontent.com/DismissibleIo/dismissible-api/main/docs/images/dismissible_logo.png" width="120" alt="Dismissible" /></a>
</p>

<p align="center">Never Show The Same Thing Twice!</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-api" target="_blank"><img src="https://img.shields.io/npm/v/@dismissible/nestjs-api.svg" alt="NPM Version" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@dismissible/nestjs-api.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-api" target="_blank"><img src="https://img.shields.io/npm/dm/@dismissible/nestjs-api.svg" alt="NPM Downloads" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api" target="_blank"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/dismissibleio/dismissible-api/release.yml"></a>
  <a href="https://paypal.me/joshstuartx" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
</p>

Dismissible manages the state of your UI elements across sessions, so your users see what matters, once! No more onboarding messages reappearing on every tab, no more notifications haunting users across devices. Dismissible syncs dismissal state everywhere, so every message is intentional, never repetitive.

**Visit [dismissible.io](https://dismissible.io)** for documentation, help, and support.

## Overview

The NestJS Dismissible API module:

- Maintains all the dismissal state for dismissible items
- Provides a REST API for managing dismissible items (get, dismiss, restore)
- Supports JWT authentication via OIDC-compliant identity providers
- Supports multiple storage backends (PostgreSQL, DynamoDB, memory)
- Includes comprehensive security features (Helmet, CORS, validation)

## Installation

```bash
npm install @dismissible/nestjs-api
```

## Usage

### Standalone Application

This contains all the bells and whistles out of the box. You create an entry point that uses the `DismissibleNestFactory` to create a new NestJS application:

```typescript
// src/main.ts
import { DismissibleNestFactory } from '@dismissible/nestjs-api';
import { CustomModule } from './custom.module';

async function bootstrap() {
  const app = await DismissibleNestFactory.create({
    imports: [CustomModule],
  });
  // The app returned is an extended version of the INestApplication app.
  // So you can use it in all the ways NestJS provides.
  await app.start();
}

bootstrap();
```

This is an extension of `NestFactory.create()`, but also wires up all our config, swagger, storage, security and much more.

#### DismissibleNestFactory Config

```typescript
interface IDismissibleNestFactoryOptions {
  configPath?: string; // Path to config files
  schema?: new () => DefaultAppConfig; // Config validation schema
  logger?: Type<IDismissibleLogger>; // Custom logger implementation
  imports?: DynamicModule[]; // Additional modules to import
}
```

### NestJS Module

Import the DismissibleModule into your existing NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-api';
import { PostgresStorageModule } from '@dismissible/nestjs-postgres-storage';
import { DynamoDbStorageModule } from '@dismissible/nestjs-dynamodb-storage';
import { MemoryStorageModule } from '@dismissible/nestjs-storage';

@Module({
  imports: [
    // PostgreSQL Storage
    DismissibleModule.forRoot({
      storage: PostgresStorageModule.forRoot({
        connectionString: process.env.DATABASE_URL,
      }),
    }),

    // Or DynamoDB Storage
    DismissibleModule.forRoot({
      storage: DynamoDbStorageModule.forRoot({
        tableName: process.env.DYNAMODB_TABLE,
        region: process.env.AWS_REGION,
        accessKeyId:
      }),
    }),

    // Or In-Memory Storage
    DismissibleModule.forRoot({
      storage: MemoryStorageModule.forRoot(),
    }),
  ],
})
export class AppModule {}
```

## API Endpoints

The API provides the following REST endpoints:

| Endpoint                            | Method | Description                                 |
| ----------------------------------- | ------ | ------------------------------------------- |
| `/health`                           | GET    | Health check endpoint                       |
| `/v1/users/{userId}/items/{itemId}` | GET    | Get or create a dismissible item            |
| `/v1/users/{userId}/items/{itemId}` | DELETE | Dismiss an item                             |
| `/v1/users/{userId}/items/{itemId}` | POST   | Restore a previously dismissed item         |
| `/v1/users/{userId}/items`          | POST   | Batch get or create multiple items (max 50) |

Enable Swagger documentation by setting `DISMISSIBLE_SWAGGER_ENABLED=true` and visit `/docs` for interactive API docs.

## Configuration

### Core Settings

| Variable                        | Description                                                               | Default    |
| ------------------------------- | ------------------------------------------------------------------------- | ---------- |
| `DISMISSIBLE_PORT`              | Port the API listens on                                                   | `3001`     |
| `DISMISSIBLE_STORAGE_TYPE`      | Storage backend type eg. `postgres`, `dynamodb`, `memory`                 | `postgres` |
| `DISMISSIBLE_STORAGE_RUN_SETUP` | Run database migrations on startup. Each storage type will have their own | `false`    |

### Storage Settings

#### PostgreSQL

PostgreSQL is a fantastic open-source relational database. It's highly performant and the majority of cloud providers and hosting companies provide a managed services. To enable PostgreSQL, set `DISMISSIBLE_STORAGE_TYPE=postgres` and provide a connection string.

| Variable                                         | Description                  | Default    |
| ------------------------------------------------ | ---------------------------- | ---------- |
| `DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING` | PostgreSQL connection string | _required_ |

> [!TIP]
> An example connection string is: `postgresql://user:password@domain.com:port/database-name` eg. `postgresql://postgres:postgres@localhost:5432/dismissible`

#### DynamoDB

DynamoDB is an infintely scalable document store as a service provided by AWS. It's perfect if you do not want to manage infrastructure or need to run at scale. To enable DynamoDB, set `DISMISSIBLE_STORAGE_TYPE=dynamodb` and pass in the following:

| Variable                                             | Description                            | Default             |
| ---------------------------------------------------- | -------------------------------------- | ------------------- |
| `DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME`            | DynamoDB table name                    | `dismissible-items` |
| `DISMISSIBLE_STORAGE_DYNAMODB_AWS_REGION`            | AWS region                             | `us-east-1`         |
| `DISMISSIBLE_STORAGE_DYNAMODB_AWS_ACCESS_KEY_ID`     | AWS access key ID                      | -                   |
| `DISMISSIBLE_STORAGE_DYNAMODB_AWS_SECRET_ACCESS_KEY` | AWS secret access key                  | -                   |
| `DISMISSIBLE_STORAGE_DYNAMODB_AWS_SESSION_TOKEN`     | AWS session token                      | -                   |
| `DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT`              | LocalStack/DynamoDB Local endpoint URL | -                   |

Depending how your IAMs is configured will depend what config you need to pass. Review the official [AWS documentation](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/getting-your-credentials.html) to determine the config you need to pass.

#### In-Memory

No configuration required. This storage backend is intended for testing and development purposes only.

### Swagger

When enabled, Swagger documentation is published to the path specified by `DISMISSIBLE_SWAGGER_PATH` (defaults to `/docs`). The OpenAPI schema is available at `${PATH}-json` (JSON format) and `${PATH}-yaml` (YAML format). For example:

- `DISMISSIBLE_SWAGGER_PATH` default is `docs`: `/docs`, `/docs-json`, `/docs-yaml`
- `swagger`: `/swagger`, `/swagger-json`, `/swagger-yaml`
- `swagger/docs`: `/swagger/docs`, `/swagger/docs-json`, `/swagger/docs-yaml`

| Variable                      | Description                                                               | Default  |
| ----------------------------- | ------------------------------------------------------------------------- | -------- |
| `DISMISSIBLE_SWAGGER_ENABLED` | Enable Swagger API docs at the path defined in `DISMISSIBLE_SWAGGER_PATH` | `false`  |
| `DISMISSIBLE_SWAGGER_PATH`    | Path for Swagger docs eg. `/docs`                                         | `"docs"` |

### JWT Authentication

You can secure your API with any OIDC-compliant provider (Auth0, Okta, Keycloak, etc.). This ensures that no one can fill your dismissible service with junk.

| Variable                                   | Description                                 | Default               |
| ------------------------------------------ | ------------------------------------------- | --------------------- |
| `DISMISSIBLE_JWT_AUTH_ENABLED`             | Enable JWT authentication                   | `false`               |
| `DISMISSIBLE_JWT_AUTH_WELL_KNOWN_URL`      | OIDC discovery URL                          | _required_ if enabled |
| `DISMISSIBLE_JWT_AUTH_ISSUER`              | Expected JWT issuer                         | _-_                   |
| `DISMISSIBLE_JWT_AUTH_AUDIENCE`            | Expected JWT audience                       | _-_                   |
| `DISMISSIBLE_JWT_AUTH_ALGORITHMS`          | Allowed algorithms (comma-separated)        | `RS256`               |
| `DISMISSIBLE_JWT_AUTH_JWKS_CACHE_DURATION` | JWKS cache duration (ms)                    | `600000`              |
| `DISMISSIBLE_JWT_AUTH_REQUEST_TIMEOUT`     | Request timeout (ms)                        | `30000`               |
| `DISMISSIBLE_JWT_AUTH_PRIORITY`            | Hook priority (lower runs first)            | `-100`                |
| `DISMISSIBLE_JWT_AUTH_MATCH_USER_ID`       | Enable user ID matching                     | `true`                |
| `DISMISSIBLE_JWT_AUTH_USER_ID_CLAIM`       | JWT claim key for user ID matching          | `sub`                 |
| `DISMISSIBLE_JWT_AUTH_USER_ID_MATCH_TYPE`  | Match method: `exact`, `substring`, `regex` | `exact`               |
| `DISMISSIBLE_JWT_AUTH_USER_ID_MATCH_REGEX` | Regex pattern (required if type=regex)      | _-_                   |

### CORS Settings

Cross-Origin Resource Sharing (CORS) controls which domains can access your API resources from browser-based clients. By default, only requests from `localhost:3000` are allowed, which is only helpful for local testing.

> [!TIP]
> Configure `DISMISSIBLE_CORS_ORIGINS` with the domains your frontend applications run on. Be careful with wildcard origins (`*`) as they may expose your API to unauthorized cross-origin requests, especially when credentials are enabled.

| Variable                           | Description                        | Default                                   |
| ---------------------------------- | ---------------------------------- | ----------------------------------------- |
| `DISMISSIBLE_CORS_ENABLED`         | Enable CORS                        | `false`                                   |
| `DISMISSIBLE_CORS_ORIGINS`         | Allowed origins (comma-separated)  | ``                                        |
| `DISMISSIBLE_CORS_METHODS`         | Allowed HTTP methods               | `GET,POST,DELETE,OPTIONS`                 |
| `DISMISSIBLE_CORS_ALLOWED_HEADERS` | Allowed headers                    | `Content-Type,Authorization,x-request-id` |
| `DISMISSIBLE_CORS_CREDENTIALS`     | Allow credentials                  | `true`                                    |
| `DISMISSIBLE_CORS_MAX_AGE`         | Preflight cache duration (seconds) | `86400`                                   |

### Security Headers (Helmet)

Helmet is a collection of middleware functions that set security-related HTTP headers. These headers help protect your API against common vulnerabilities like cross-site scripting (XSS), clickjacking, and other attacks by instructing browsers to enforce security policies. For most production deployments, keeping Helmet enabled is recommended. You may disable it if you have specific requirements for custom headers or are behind a separate security layer (e.g., a CDN or WAF that handles these protections).

| Variable                                     | Description                         | Default    |
| -------------------------------------------- | ----------------------------------- | ---------- |
| `DISMISSIBLE_HELMET_ENABLED`                 | Enable Helmet security headers      | `true`     |
| `DISMISSIBLE_HELMET_CSP`                     | Enable Content Security Policy      | `true`     |
| `DISMISSIBLE_HELMET_COEP`                    | Enable Cross-Origin Embedder Policy | `true`     |
| `DISMISSIBLE_HELMET_HSTS_MAX_AGE`            | HSTS max age (seconds)              | `31536000` |
| `DISMISSIBLE_HELMET_HSTS_INCLUDE_SUBDOMAINS` | Include subdomains in HSTS          | `true`     |
| `DISMISSIBLE_HELMET_HSTS_PRELOAD`            | Enable HSTS preload                 | `false`    |

### Validation Settings

This config prevents internal error messages from leaking out. In production environements, these should all be set to `true`, but in lower environements they can be set to `false` to help with debugging.

| Variable                                        | Description                     | Default |
| ----------------------------------------------- | ------------------------------- | ------- |
| `DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES` | Hide detailed validation errors | `true`  |
| `DISMISSIBLE_VALIDATION_WHITELIST`              | Strip unknown properties        | `true`  |
| `DISMISSIBLE_VALIDATION_FORBID_NON_WHITELISTED` | Reject unknown properties       | `true`  |
| `DISMISSIBLE_VALIDATION_TRANSFORM`              | Auto-transform payloads to DTOs | `true`  |

## NestJS API Module Configuration

The [Dismissible NestJS Module API library](https://www.npmjs.com/package/@dismissible/nestjs-api) has an alternative way to set configuration by using a `.env.yaml` file eg. [`api/config/.env.yaml`](api/config/.env.yaml)

### Example YAML file

Below is the default config file which contains both default values and a way to interpolate the [environment variables](#all-configuration-options) defined above.

```yaml
server:
  port: ${DISMISSIBLE_PORT:-3001}

swagger:
  enabled: ${DISMISSIBLE_SWAGGER_ENABLED:-true}
  path: ${DISMISSIBLE_SWAGGER_PATH:-docs}

helmet:
  enabled: ${DISMISSIBLE_HELMET_ENABLED:-true}
  contentSecurityPolicy: ${DISMISSIBLE_HELMET_CSP:-false}
  crossOriginEmbedderPolicy: ${DISMISSIBLE_HELMET_COEP:-false}
  hstsMaxAge: ${DISMISSIBLE_HELMET_HSTS_MAX_AGE:-31536000}
  hstsIncludeSubDomains: ${DISMISSIBLE_HELMET_HSTS_INCLUDE_SUBDOMAINS:-true}
  hstsPreload: ${DISMISSIBLE_HELMET_HSTS_PRELOAD:-false}

cors:
  enabled: ${DISMISSIBLE_CORS_ENABLED:-true}
  origins: ${DISMISSIBLE_CORS_ORIGINS:-http://localhost:3001,http://localhost:5173}
  methods: ${DISMISSIBLE_CORS_METHODS:-GET,POST,DELETE,OPTIONS}
  allowedHeaders: ${DISMISSIBLE_CORS_ALLOWED_HEADERS:-Content-Type,Authorization,x-request-id}
  credentials: ${DISMISSIBLE_CORS_CREDENTIALS:-true}
  maxAge: ${DISMISSIBLE_CORS_MAX_AGE:-86400}

storage:
  # postgres | dynamodb | memory
  type: ${DISMISSIBLE_STORAGE_TYPE:-postgres}
  postgres:
    connectionString: ${DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING:-postgresql://postgres:postgres@localhost:5432/dismissible}
  dynamodb:
    tableName: ${DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME:-dismissible-items}
    region: ${DISMISSIBLE_STORAGE_DYNAMODB_AWS_REGION:-us-east-1}
    endpoint: ${DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT:-}
    accessKeyId: ${DISMISSIBLE_STORAGE_DYNAMODB_AWS_ACCESS_KEY_ID:-}
    secretAccessKey: ${DISMISSIBLE_STORAGE_DYNAMODB_AWS_SECRET_ACCESS_KEY:-}
    sessionToken: ${DISMISSIBLE_STORAGE_DYNAMODB_AWS_SESSION_TOKEN:-}

jwtAuth:
  enabled: ${DISMISSIBLE_JWT_AUTH_ENABLED:-false}
  wellKnownUrl: ${DISMISSIBLE_JWT_AUTH_WELL_KNOWN_URL:-}
  issuer: ${DISMISSIBLE_JWT_AUTH_ISSUER:-}
  audience: ${DISMISSIBLE_JWT_AUTH_AUDIENCE:-}
  algorithms:
    - ${DISMISSIBLE_JWT_AUTH_ALGORITHMS:-RS256}
  jwksCacheDuration: ${DISMISSIBLE_JWT_AUTH_JWKS_CACHE_DURATION:-600000}
  requestTimeout: ${DISMISSIBLE_JWT_AUTH_REQUEST_TIMEOUT:-30000}
  priority: ${DISMISSIBLE_JWT_AUTH_PRIORITY:--100}
  matchUserId: ${DISMISSIBLE_JWT_AUTH_MATCH_USER_ID:-true}
  userIdClaim: ${DISMISSIBLE_JWT_AUTH_USER_ID_CLAIM:-sub}
  userIdMatchType: ${DISMISSIBLE_JWT_AUTH_USER_ID_MATCH_TYPE:-exact}
  userIdMatchRegex: ${DISMISSIBLE_JWT_AUTH_USER_ID_MATCH_REGEX:-}

validation:
  disableErrorMessages: ${DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES:-true}
  whitelist: ${DISMISSIBLE_VALIDATION_WHITELIST:-true}
  forbidNonWhitelisted: ${DISMISSIBLE_VALIDATION_FORBID_NON_WHITELISTED:-true}
  transform: ${DISMISSIBLE_VALIDATION_TRANSFORM:-true}
```

### Usage

When creating your application, you can specify the directory that contains your YAML config files eg.

If we have a structure like:

```
config/
└── .env.yaml
src/
├── main.ts
└── custom.module.ts
```

And our `main.ts` file is:

```typescript
import { DismissibleNestFactory } from '@dismissible/nestjs-api';
import { CustomModule } from './custom.module';

const configPath = join(__dirname, '../config');

async function bootstrap() {
  const app = await DismissibleNestFactory.create({
    imports: [CustomModule],
    configPath,
  });
  await app.start();
}

bootstrap();
```

### Environment Aware

You can maintain multiple config files which are controlled by `NODE_ENV`. The format needs to follow:

`.env.{NODE_ENV}.yaml`

eg. If we have the following files:

```
config/
└── .env.yaml
└── .env.dev.yaml
└── .env.staging.yaml
└── .env.production.yaml
```

Then if we pass `NODE_ENV=production`, the `.env.production.yaml` file will be loaded automaticall. This is super handy to maintain separate config files per environment.

### Environment Variable Interpolation

You can specify environment variables within the YAML file, including a default, and they will be interpolated at run time.

The fomat needs to follow: `${ENV_VAR:-default-value}`.

> [!WARNING]  
> If you don't specify a `default-value`, and only `${ENV_VAR}`, then if the config is required but not present, and error will be thrown.

> [!TIP]
> Use interpolation of environment variables for sensitive config like secrets and connection strings.

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
# PostgreSQL (default)
docker run -p 3001:3001 \
  -e DISMISSIBLE_STORAGE_TYPE=postgres \
  -e DISMISSIBLE_STORAGE_RUN_SETUP=true \
  -e DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING="postgresql://user:password@host:5432/dismissible" \
  dismissibleio/dismissible-api:latest

# DynamoDB
docker run -p 3001:3001 \
  -e DISMISSIBLE_STORAGE_TYPE=dynamodb \
  -e DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME="items" \
  -e DISMISSIBLE_STORAGE_DYNAMODB_REGION="us-east-1" \
  dismissibleio/dismissible-api:latest

# In-Memory (development/testing)
docker run -p 3001:3001 \
  -e DISMISSIBLE_STORAGE_TYPE=memory \
  dismissibleio/dismissible-api:latest
```

See [docs/DOCKER.md](../docs/DOCKER.md) for complete deployment instructions.

## Storage Setup

**CRITICAL**: The storage schema must be initialized before starting the API. The setup process depends on your chosen storage backend.

### PostgreSQL Setup

```bash
# Generate Prisma client
npm run storage:init

# Run migrations (development)
npm run prisma:migrate:dev

# Deploy migrations (production)
npm run prisma:migrate:deploy

# Push schema (development only)
npm run prisma:db:push
```

### DynamoDB Setup

```bash
# Create the DynamoDB table
npm run storage:init
npm run dynamodb:setup
```

The DynamoDB table will be created with the following schema:

- Partition key: `userId` (String)
- Sort key: `itemId` (String)

### In-Memory Setup

No setup required. The storage is ready to use immediately.

## Features

- **REST API**: Clean, simple endpoints for managing dismissible items
- **JWT Authentication**: Secure your API with OIDC-compliant identity providers (Auth0, Okta, Keycloak)
- **Multiple Storage Backends**: PostgreSQL, DynamoDB, or memory storage
- **Swagger Documentation**: Interactive API docs when enabled
- **Security**: Helmet for security headers, CORS configuration, request validation
- **TypeScript**: Full TypeScript support with type safety
- **Docker Ready**: Multi-stage Dockerfile for production deployments

## Related Packages

- `@dismissible/nestjs-core` - Main dismissible code service and logic
- `@dismissible/nestjs-postgres-storage` - PostgreSQL storage adapter
- `@dismissible/nestjs-dynamodb-storage` - DynamoDB storage adapter
- `@dismissible/nestjs-storage` - Storage interface definition
- `@dismissible/nestjs-logger` - Logging abstraction
- `@dismissible/nestjs-jwt-auth-hook` - JWT authentication hook
- `@dismissible/react-client` - React client for the Dismissible system

## License

MIT
