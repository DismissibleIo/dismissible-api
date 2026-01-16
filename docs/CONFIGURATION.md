# Dismissible API - Configuration

The [Dismissible Docker API](https://hub.docker.com/r/dismissibleio/dismissible-api) and the [Dismissible NestJS Module API library](https://www.npmjs.com/package/@dismissible/nestjs-api)

## All Configuration Options

All configuration can be managed via the following environment variables:

### Core Settings

| Variable                        | Description                                                               | Default  |
| ------------------------------- | ------------------------------------------------------------------------- | -------- |
| `DISMISSIBLE_PORT`              | Port the API listens on                                                   | `3001`   |
| `DISMISSIBLE_STORAGE_TYPE`      | Storage backend type eg. `postgres`, `dynamodb`, `memory`                 | `memory` |
| `DISMISSIBLE_STORAGE_RUN_SETUP` | Run database migrations on startup. Each storage type will have their own | `false`  |

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

In-memory storage uses an LRU (Least Recently Used) cache. This storage backend is intended for testing and development purposes only.

| Variable                               | Description                      | Default    |
| -------------------------------------- | -------------------------------- | ---------- |
| `DISMISSIBLE_STORAGE_MEMORY_MAX_ITEMS` | Maximum number of items to store | `5000`     |
| `DISMISSIBLE_STORAGE_MEMORY_TTL_MS`    | Time-to-live in milliseconds     | `21600000` |

> [!WARNING]
> Data stored in memory will be lost when the application restarts. Do not use in production or for multi-instance deployments.

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
| `DISMISSIBLE_CORS_ORIGINS`         | Allowed origins (comma-separated)  | -                                         |
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

### Rate Limiter Settings

Rate limiting protects your API from abuse by limiting the number of requests from a given source. When enabled, requests exceeding the limit receive a `429 Too Many Requests` response.

| Variable                                  | Description                                                                 | Default              |
| ----------------------------------------- | --------------------------------------------------------------------------- | -------------------- |
| `DISMISSIBLE_RATE_LIMITER_ENABLED`        | Enable rate limiting                                                        | `false`              |
| `DISMISSIBLE_RATE_LIMITER_POINTS`         | Number of requests allowed per duration window                              | `1000`               |
| `DISMISSIBLE_RATE_LIMITER_DURATION`       | Time window in seconds                                                      | `1`                  |
| `DISMISSIBLE_RATE_LIMITER_BLOCK_DURATION` | Duration in seconds to block requests after limit exceeded                  | `60`                 |
| `DISMISSIBLE_RATE_LIMITER_KEY_TYPE`       | Key type(s) for rate limiting (comma-separated): `ip`, `origin`, `referrer` | `ip,origin,referrer` |
| `DISMISSIBLE_RATE_LIMITER_KEY_MODE`       | Mode for combining key types: `and`, `or`, `any`                            | `any`                |
| `DISMISSIBLE_RATE_LIMITER_IGNORED_KEYS`   | Comma-separated keys to bypass rate limiting                                | -                    |
| `DISMISSIBLE_RATE_LIMITER_PRIORITY`       | Hook priority (lower runs first)                                            | `-101`               |

#### Key Types

- **`ip`**: Rate limit by IP address (extracted from `x-forwarded-for` or `x-real-ip` headers)
- **`origin`**: Rate limit by Origin header hostname (useful for CORS scenarios)
- **`referrer`**: Rate limit by Referer header hostname

#### Key Modes

- **`and`**: Combine all key types into a single key (e.g., `192.168.1.1:example.com`)
- **`or`**: Use the first available key type as a fallback chain
- **`any`**: Check all key types independently - request is blocked if ANY key exceeds the limit

#### Ignored Keys

The `DISMISSIBLE_RATE_LIMITER_IGNORED_KEYS` variable accepts a comma-separated list of keys to bypass rate limiting. Matching is exact after trim+lowercase. For Origin/Referer, the URL hostname is matched (e.g., `https://google.com/search` matches `google.com`).

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
  origins: ${DISMISSIBLE_CORS_ORIGINS:-}
  methods: ${DISMISSIBLE_CORS_METHODS:-GET,POST,DELETE,OPTIONS}
  allowedHeaders: ${DISMISSIBLE_CORS_ALLOWED_HEADERS:-Content-Type,Authorization,x-request-id}
  credentials: ${DISMISSIBLE_CORS_CREDENTIALS:-true}
  maxAge: ${DISMISSIBLE_CORS_MAX_AGE:-86400}

storage:
  # postgres | dynamodb | memory
  type: ${DISMISSIBLE_STORAGE_TYPE:-memory}
  postgres:
    connectionString: ${DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING:-}
  dynamodb:
    tableName: ${DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME:-dismissible-items}
    region: ${DISMISSIBLE_STORAGE_DYNAMODB_AWS_REGION:-us-east-1}
    endpoint: ${DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT:-}
    accessKeyId: ${DISMISSIBLE_STORAGE_DYNAMODB_AWS_ACCESS_KEY_ID:-}
    secretAccessKey: ${DISMISSIBLE_STORAGE_DYNAMODB_AWS_SECRET_ACCESS_KEY:-}
    sessionToken: ${DISMISSIBLE_STORAGE_DYNAMODB_AWS_SESSION_TOKEN:-}
  memory:
    maxItems: ${DISMISSIBLE_STORAGE_MEMORY_MAX_ITEMS:-5000}
    ttlMs: ${DISMISSIBLE_STORAGE_MEMORY_TTL_MS:-21600000}

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

rateLimiter:
  enabled: ${DISMISSIBLE_RATE_LIMITER_ENABLED:-false}
  points: ${DISMISSIBLE_RATE_LIMITER_POINTS:-1000}
  duration: ${DISMISSIBLE_RATE_LIMITER_DURATION:-1}
  blockDuration: ${DISMISSIBLE_RATE_LIMITER_BLOCK_DURATION:-60}
  keyType: ${DISMISSIBLE_RATE_LIMITER_KEY_TYPE:-ip,origin,referrer}
  keyMode: ${DISMISSIBLE_RATE_LIMITER_KEY_MODE:-any}
  ignoredKeys: ${DISMISSIBLE_RATE_LIMITER_IGNORED_KEYS:-}
  priority: ${DISMISSIBLE_RATE_LIMITER_PRIORITY:--101}
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
import { AuditHook } from './hooks';
import { CustomLogger } from './logger';

const configPath = join(__dirname, '../config');

async function bootstrap() {
  const app = await DismissibleNestFactory.create({
    configPath,
    // Additional NestJS modules
    imports: [CustomModule],
    // Lifecycle hooks
    hooks: [AuditHook],
    // Custom logger implementation
    logger: CustomLogger,
    // Storage type override (defaults to DISMISSIBLE_STORAGE_TYPE env var)
    // storage: 'postgres',
  });
  await app.start();
}

bootstrap();
```

> [!TIP]
> See the [NestJS API Module documentation](./NESTJS_API_MODULE.md#module-configuration) for the full list of programmatic configuration options including custom providers and controllers.

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
