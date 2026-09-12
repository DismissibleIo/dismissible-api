# Running Dismissible Locally

This guide covers all ways to run the Dismissible API on your local machine.

---

## Table of Contents

TBA

---

## Prerequisites

### Required Tools

| Tool                                               | Version | Description             |
| -------------------------------------------------- | ------- | ----------------------- |
| [Node.js](https://nodejs.org/)                     | 24.21.0 | JavaScript runtime      |
| [npm](https://www.npmjs.com/)                      | 11+     | Package manager         |
| [Docker](https://www.docker.com/)                  | Latest  | Container runtime       |
| [Docker Compose](https://docs.docker.com/compose/) | Latest  | Container orchestration |

### Recommended Tools

| Tool                                 | Description          |
| ------------------------------------ | -------------------- |
| [nvm](https://github.com/nvm-sh/nvm) | Node version manager |

### Verify Your Setup

```bash
node --version    # Should be v24.21.0
npm --version     # Should be v11 or higher
docker --version  # Should be latest stable
docker-compose --version  # Should be latest
```

---

## Getting Started

The following only needs to be run once during setup.

```shell
# Install dependencies from the root lockfile
npm ci

# Generate the Prisma client and start fresh local services
NX_DAEMON=false npm run storage:init
NX_DAEMON=false npm run storage:start

# Setup the PostgreSQL and DynamoDB schemas/tables
NX_DAEMON=false npm run storage:setup
```

## Running the API

### Node

You can run the server using the local node instance which will also watch files for changes and restart the server.

```shell
# with postgres
npm run serve:postgres

# with dynamo
npm run serve:dynamodb

# with in memory
npm run serve:memory
```

The API will be available at `http://localhost:3001`.

## Building the Docker Image Locally

### Basic Build

Build the Docker image from your local source:

```bash
docker build -t dismissible-api .
```

### Build with Custom Tag

```bash
docker build -t dismissible-api:v1.0.0-dev .
```

### Build with No Cache

Force a clean rebuild (useful after dependency changes):

```bash
docker build --no-cache -t dismissible-api .
```

### Verify the Production Image

Build both supported CPU architectures without pushing an image, then load the
current host architecture for a local smoke check:

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t dismissible-api:multiarch .
docker buildx build --load -t dismissible-api:local .

# Uses isolated in-memory storage and verifies startup plus GET /health.
DISMISSIBLE_TEST_STORAGE_TYPE=memory \
  DISMISSIBLE_STORAGE_RUN_SETUP=false \
  ./scripts/test-docker-image.sh --no-build dismissible-api:local
```

To verify startup setup, point the smoke check at a disposable PostgreSQL
instance and set `DISMISSIBLE_STORAGE_RUN_SETUP=true`. The supported flag is
`DISMISSIBLE_STORAGE_RUN_SETUP`; `DISMISSIBLE_RUN_MIGRATION` is not read by the
image. Startup failures include container state and logs, and the smoke check
cleans up only its own container.

### Build and Run Immediately

```bash
# Build the image
docker build -t dismissible-api .

# Run the container
docker run -p 3001:3001 \
  -e DISMISSIBLE_STORAGE_TYPE="postgres" \
  -e DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING="postgresql://postgres:postgres@host.docker.internal:5432/dismissible" \
  dismissible-api


docker run --rm -p 3001:3001 \
  -e DISMISSIBLE_STORAGE_TYPE="memory" \
  dismissible-api


docker run -p 3001:3001 \
  -e DISMISSIBLE_CACHE_TYPE="redis" \
  -e DISMISSIBLE_CACHE_REDIS_URL="redis://localhost:6379" \
  -e DISMISSIBLE_STORAGE_TYPE="postgres" \
  -e DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING="postgresql://postgres:postgres@host.docker.internal:5432/dismissible" \
  dismissible-api
```

### Run the container with interactive terminal

```bash
docker run -it --rm dismissible-api /bin/sh
```

### Verify the Build

```bash
# Run a quick health check
docker run --rm -p 3001:3001 \
  -e DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING="postgresql://postgres:postgres@host.docker.internal:5432/dismissible" \
  dismissible-api \
  sh -c "wget --no-verbose --tries=1 --spider http://localhost:3001/health"
```

### Run with configuration

```bash
docker run -d \
  --name dismissible-api \
  -p 3002:3002 \
  -e DISMISSIBLE_PORT=3002 \
  -e DISMISSIBLE_SWAGGER_ENABLED=true \
  -e DISMISSIBLE_SWAGGER_PATH="docs" \
  -e DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING="postgresql://postgres:postgres@host.docker.internal:5432/dismissible" \
  -e DISMISSIBLE_JWT_AUTH_ENABLED=false \
  -e DISMISSIBLE_HELMET_ENABLED=true \
  -e DISMISSIBLE_HELMET_CSP=true \
  -e DISMISSIBLE_CORS_ENABLED=true \
  -e DISMISSIBLE_CORS_ORIGINS="http://localhost:3000" \
  -e DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES=true \
  dismissible-api
```

### Using Environment Files

Create a `.env` file:

```bash
# .env
DISMISSIBLE_PORT=3001
DISMISSIBLE_SWAGGER_ENABLED=true
DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING=postgresql://postgres:postgres@host.docker.internal:5432/dismissible
DISMISSIBLE_JWT_AUTH_ENABLED=false
DISMISSIBLE_CORS_ORIGINS=http://localhost:3000
```

Run with the environment file:

```bash
docker run -d \
  --name dismissible-api \
  -p 3001:3001 \
  --env-file .env \
  dismissible-api
```

## Storage Options

See storage options

## Running Tests

### Run All Unit Tests

```bash
npm test
```

### Run Tests for Specific Projects

```bash
# Test only the API
npx nx test api

# Test only a specific library
npx nx test dismissible

# Test all libraries
npx nx run-many --target=test --projects=libs/*
```

### Run E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run API E2E tests with memory storage
npm run test:e2e:api:memory

# Run API E2E tests with PostgreSQL storage
npm run test:e2e:api:postgres

# Run API E2E tests with DynamoDB storage
npm run test:e2e:api:dynamodb

# Run API E2E tests with all storage backends
npm run test:e2e:api:all

# Run library E2E tests
npm run test:e2e:lib:dismissible:all
```

### Performance Tests

```bash
npm run test:perf
```

### Validate Before Committing

```bash
npm run validate
```

This runs: prettier check, linting, commit message validation, unit tests, and E2E tests.

## Environment Variables

See configuration.

### Core Settings

| Variable                        | Description                                | Default    |
| ------------------------------- | ------------------------------------------ | ---------- |
| `DISMISSIBLE_PORT`              | Port the API listens on                    | `3001`     |
| `DISMISSIBLE_SWAGGER_ENABLED`   | Enable Swagger documentation               | `false`    |
| `DISMISSIBLE_SWAGGER_PATH`      | Swagger documentation path                 | `""`       |
| `DISMISSIBLE_STORAGE_TYPE`      | Storage backend (`postgres` or `dynamodb`) | `postgres` |
| `DISMISSIBLE_STORAGE_RUN_SETUP` | Run database migrations on startup         | `true`     |

### PostgreSQL Storage

| Variable                                         | Description                  | Default         |
| ------------------------------------------------ | ---------------------------- | --------------- |
| `DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING` | PostgreSQL connection string | `""` (required) |

### DynamoDB Storage

| Variable                                             | Description                        | Default             |
| ---------------------------------------------------- | ---------------------------------- | ------------------- |
| `DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME`            | DynamoDB table name                | `dismissible-items` |
| `DISMISSIBLE_STORAGE_DYNAMODB_AWS_REGION`            | AWS region                         | `us-east-1`         |
| `DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT`              | DynamoDB Local/custom endpoint URL | `""`                |
| `DISMISSIBLE_STORAGE_DYNAMODB_AWS_ACCESS_KEY_ID`     | AWS access key                     | `""`                |
| `DISMISSIBLE_STORAGE_DYNAMODB_AWS_SECRET_ACCESS_KEY` | AWS secret key                     | `""`                |

### JWT Authentication

| Variable                                   | Description                                 | Default  |
| ------------------------------------------ | ------------------------------------------- | -------- |
| `DISMISSIBLE_JWT_AUTH_ENABLED`             | Enable JWT authentication                   | `false`  |
| `DISMISSIBLE_JWT_AUTH_WELL_KNOWN_URL`      | OIDC well-known URL for JWKS discovery      | `""`     |
| `DISMISSIBLE_JWT_AUTH_ISSUER`              | Expected issuer claim                       | `""`     |
| `DISMISSIBLE_JWT_AUTH_AUDIENCE`            | Expected audience claim                     | `""`     |
| `DISMISSIBLE_JWT_AUTH_ALGORITHMS`          | Allowed algorithms (comma-separated)        | `RS256`  |
| `DISMISSIBLE_JWT_AUTH_JWKS_CACHE_DURATION` | JWKS cache duration in ms                   | `600000` |
| `DISMISSIBLE_JWT_AUTH_REQUEST_TIMEOUT`     | Request timeout in ms                       | `30000`  |
| `DISMISSIBLE_JWT_AUTH_PRIORITY`            | Hook priority (lower runs first)            | `-100`   |
| `DISMISSIBLE_JWT_AUTH_MATCH_USER_ID`       | Enable user ID matching                     | `true`   |
| `DISMISSIBLE_JWT_AUTH_USER_ID_CLAIM`       | JWT claim key for user ID matching          | `sub`    |
| `DISMISSIBLE_JWT_AUTH_USER_ID_MATCH_TYPE`  | Match method: `exact`, `substring`, `regex` | `exact`  |
| `DISMISSIBLE_JWT_AUTH_USER_ID_MATCH_REGEX` | Regex pattern (required if type=regex)      | `""`     |

#### User ID Match Types

- **`exact`**: Token claim must exactly match URL user ID
- **`substring`**: URL user ID must be contained in token claim
- **`regex`**: Pattern is applied to token claim; if a capture group exists, the first capture group is extracted and compared to URL user ID, otherwise the full match is used

See the [@dismissible/nestjs-jwt-auth-hook README](../libs/jwt-auth-hook/README.md#user-id-match-types) for detailed examples.

### Security Headers (Helmet)

| Variable                                     | Description                         | Default    |
| -------------------------------------------- | ----------------------------------- | ---------- |
| `DISMISSIBLE_HELMET_ENABLED`                 | Enable Helmet security headers      | `true`     |
| `DISMISSIBLE_HELMET_CSP`                     | Enable Content Security Policy      | `true`     |
| `DISMISSIBLE_HELMET_COEP`                    | Enable Cross-Origin Embedder Policy | `true`     |
| `DISMISSIBLE_HELMET_HSTS_MAX_AGE`            | HSTS max age in seconds             | `31536000` |
| `DISMISSIBLE_HELMET_HSTS_INCLUDE_SUBDOMAINS` | Include subdomains in HSTS          | `true`     |
| `DISMISSIBLE_HELMET_HSTS_PRELOAD`            | Enable HSTS preload                 | `false`    |

### CORS Settings

| Variable                           | Description                        | Default                                   |
| ---------------------------------- | ---------------------------------- | ----------------------------------------- |
| `DISMISSIBLE_CORS_ENABLED`         | Enable CORS                        | `true`                                    |
| `DISMISSIBLE_CORS_ORIGINS`         | Allowed origins (comma-separated)  | `http://localhost:3000`                   |
| `DISMISSIBLE_CORS_METHODS`         | Allowed HTTP methods               | `GET,POST,DELETE,OPTIONS`                 |
| `DISMISSIBLE_CORS_ALLOWED_HEADERS` | Allowed headers                    | `Content-Type,Authorization,x-request-id` |
| `DISMISSIBLE_CORS_CREDENTIALS`     | Allow credentials                  | `true`                                    |
| `DISMISSIBLE_CORS_MAX_AGE`         | Preflight cache duration (seconds) | `86400`                                   |

### Validation Settings

| Variable                                        | Description                      | Default |
| ----------------------------------------------- | -------------------------------- | ------- |
| `DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES` | Disable detailed error messages  | `true`  |
| `DISMISSIBLE_VALIDATION_WHITELIST`              | Strip non-whitelisted properties | `true`  |
| `DISMISSIBLE_VALIDATION_FORBID_NON_WHITELISTED` | Throw error on non-whitelisted   | `true`  |
| `DISMISSIBLE_VALIDATION_TRANSFORM`              | Auto-transform payloads          | `true`  |

---

## Verifying the Installation

### Health Check

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### API Endpoints

| Endpoint                            | Method   | Description                                 |
| ----------------------------------- | -------- | ------------------------------------------- |
| `/health`                           | `GET`    | Health check endpoint                       |
| `/v1/users/{userId}/items/{itemId}` | `GET`    | Get or create a dismissible item            |
| `/v1/users/{userId}/items/{itemId}` | `DELETE` | Dismiss an item                             |
| `/v1/users/{userId}/items/{itemId}` | `POST`   | Restore a dismissed item                    |
| `/v1/users/{userId}/items`          | `POST`   | Batch get or create multiple items (max 50) |

### Test the API

```bash
# Create or get a dismissible item
curl -X GET http://localhost:3001/v1/users/test-user/items/test-item

# Dismiss the item
curl -X DELETE http://localhost:3001/v1/users/test-user/items/test-item

# Restore the item
curl -X POST http://localhost:3001/v1/users/test-user/items/test-item
```

### Swagger Documentation

If Swagger is enabled, access the API documentation at:

```
http://localhost:3001/docs
```

## Example configs

### DynamoDB

```bash
docker run --rm -p 3001:3001 \
  -e DISMISSIBLE_STORAGE_TYPE="dynamodb" \
  -e DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT="http://host.docker.internal:4566" \
  -e DISMISSIBLE_STORAGE_DYNAMODB_AWS_ACCESS_KEY_ID="test" \
  -e DISMISSIBLE_STORAGE_DYNAMODB_AWS_SECRET_ACCESS_KEY="test" \
  dismissible-api
```

### PostgreSQL

The dependency refresh verified Prisma CLI/client/pg adapter `7.10.0`, `pg`
`8.23.0`, and `@types/pg` `8.23.1` on Node 24 / NestJS 11. Prisma's npm `latest`
tag currently points to the `8.0.0-rc.13` prerelease; `7.10.0` is the matching
stable release selected here. Compose and CI use `postgres:18.6`, verified against
the [PostgreSQL release notes](https://www.postgresql.org/docs/release/18.6/) and
the [official image](https://hub.docker.com/_/postgres).

PostgreSQL 18 mounts `/var/lib/postgresql`, with its versioned data directory
underneath. Compose uses a new `postgres_18_data` volume and waits for
`pg_isready`; previous `postgres_data` volumes are not reused or migrated.

Verification on 2026-09-11 used a fresh container with tmpfs storage and a separate
database for the production image. Clean `npm ci`, Prisma generation, empty-state
migrations, repeated setup retaining a sentinel row, all 15 project unit-test,
lint and build targets, formatting, and all five Postgres API E2E suites (16 tests)
passed. The pruned production image initialized the empty database, loaded the
compiled Prisma client and bundled setup CLI, passed its health endpoint and
create/dismiss/restore requests, and retained the record after repeated setup.

For isolated E2E runs, set `DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING` to
your disposable database before `NX_DAEMON=false npm run test:e2e:api:postgres`.
The default test fixture honors this value and otherwise uses localhost:5432.

The Prisma CLI remains a production dependency because startup migrations need
it. Its current stable dependency tree still reports upstream npm audit findings
for `deepmerge-ts` and `mysql2`; no prerelease upgrade or forced major override
was used to suppress those findings. Existing audit findings outside this storage
refresh remain separate from the compatibility checks above.

```bash
docker run --rm -p 3001:3001 \
  -e DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING="postgresql://postgres:postgres@host.docker.internal:5432/dismissible" \
  dismissible-api
```

---

## Cache and rate-limiter refresh

The 2026-09-11 refresh uses `lru-cache` `11.5.2` for memory cache/storage,
`ioredis` `6.0.0`, and `rate-limiter-flexible` `11.2.0`. These packages include
their TypeScript declarations. Versions were checked against the npm registry;
Compose, CI, and the Docker examples use the explicit `redis:8.10.1` release from
the [official Redis image catalog](https://github.com/docker-library/official-images/blob/master/library/redis).
Compose waits for `redis-cli ping` before starting the API.

The global `lru-cache` override and its nested exceptions were removed. Each
consumer now resolves its supported major: application memory adapters,
`jwks-rsa`, `lru-memoizer`, and the current `path-scurry` use 11; Jest's older
`path-scurry` keeps 10, and Babel keeps 5. No incompatible major is forced onto
those tooling dependencies. The production image also copies the memory
adapters' nested production dependencies, which are needed after pruning.

The memory adapters retain their 5000-item capacity and six-hour default TTL.
Redis retains its key prefix, serialization, TTL conversion, and readiness/
retry configuration. ioredis 6 negotiates RESP3 with legacy-compatible replies
(and falls back to RESP2), as described in its
[upgrade guide](https://github.com/redis/ioredis/wiki/Upgrading-from-v5-to-v6).
Disabled rate-limit configurations still omit points/duration: the service now
creates its limiter only when enabled because version 11 requires both options.

Verification used clean `npm ci`, all 15 project unit-test, lint and build
targets, formatting, and the cache/rate-limiter API E2E suites (27 tests), with
fresh Redis tmpfs data on a random loopback port. The E2E fixtures honor
`DISMISSIBLE_CACHE_REDIS_URL`; use a disposable instance because cache tests flush
its selected database. Memory eviction/TTL, Redis prefix/TTL, disabled caching,
and allowed/blocked rate-limit requests are covered. Existing Redis data was not
used or modified.

```bash
# Set this to your disposable Redis instance before running the cache tests.
export DISMISSIBLE_CACHE_REDIS_URL=redis://127.0.0.1:16379
NX_DAEMON=false npm exec nx run api:test-e2e:other -- \
  --testPathPatterns='cache.e2e-spec|rate-limiter.e2e-spec' --skip-nx-cache
```

## Next Steps

- [Docker Deployment Guide](DOCKER.md) - Complete Docker deployment with production best practices
- [NPM API Documentation](NPM_API.md) - NestJS module integration with hooks, events, and custom storage
- [README](../README.md) - Full project overview and architecture
