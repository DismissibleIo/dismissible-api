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
| [Node.js](https://nodejs.org/)                     | 24+     | JavaScript runtime      |
| [npm](https://www.npmjs.com/)                      | 10+     | Package manager         |
| [Docker](https://www.docker.com/)                  | Latest  | Container runtime       |
| [Docker Compose](https://docs.docker.com/compose/) | Latest  | Container orchestration |

### Recommended Tools

| Tool                                 | Description          |
| ------------------------------------ | -------------------- |
| [nvm](https://github.com/nvm-sh/nvm) | Node version manager |

### Verify Your Setup

```bash
node --version    # Should be v24 or higher
npm --version     # Should be v10 or higher
docker --version  # Should be latest stable
docker-compose --version  # Should be latest
```

---

## Getting Started

The following only needs to be run once during setup.

```shell
# Install dependencies
npm install
npm run db:init

# Start DBs: starts postgres and dynamodb in docker containers
npm run db:start

# Setup DBs: creates tables in postgres and dynamodb
npm run db:setup
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
| `DISMISSIBLE_RUN_STORAGE_SETUP` | Run database migrations on startup         | `true`     |

### PostgreSQL Storage

| Variable                                         | Description                  | Default         |
| ------------------------------------------------ | ---------------------------- | --------------- |
| `DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING` | PostgreSQL connection string | `""` (required) |

### DynamoDB Storage

| Variable                                             | Description             | Default             |
| ---------------------------------------------------- | ----------------------- | ------------------- |
| `DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME`            | DynamoDB table name     | `dismissible-items` |
| `DISMISSIBLE_STORAGE_DYNAMODB_AWS_REGION`            | AWS region              | `us-east-1`         |
| `DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT`              | LocalStack endpoint URL | `""`                |
| `DISMISSIBLE_STORAGE_DYNAMODB_AWS_ACCESS_KEY_ID`     | AWS access key          | `""`                |
| `DISMISSIBLE_STORAGE_DYNAMODB_AWS_SECRET_ACCESS_KEY` | AWS secret key          | `""`                |

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

| Endpoint                            | Method   | Description                      |
| ----------------------------------- | -------- | -------------------------------- |
| `/health`                           | `GET`    | Health check endpoint            |
| `/v1/users/{userId}/items/{itemId}` | `GET`    | Get or create a dismissible item |
| `/v1/users/{userId}/items/{itemId}` | `DELETE` | Dismiss an item                  |
| `/v1/users/{userId}/items/{itemId}` | `POST`   | Restore a dismissed item         |

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

```bash
docker run --rm -p 3001:3001 \
  -e DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING="postgresql://postgres:postgres@host.docker.internal:5432/dismissible" \
  dismissible-api
```

---

## Next Steps

- [Docker Deployment Guide](DOCKER.md) - Complete Docker deployment with production best practices
- [NPM API Documentation](NPM_API.md) - NestJS module integration with hooks, events, and custom storage
- [README](../README.md) - Full project overview and architecture
