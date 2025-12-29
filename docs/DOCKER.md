# Dismissible API - Docker image

[Dismissible Website](https://dismissible.io)

Dismissible manages the state of your UI elements across sessions, so your users see what matters, once! No more onboarding messages reappearing on every tab, no more notifications haunting users across devices. Dismissible syncs dismissal state everywhere, so every message is intentional, never repetitive.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Running the Container](#running-the-container)
  - [Database Migrations](#database-migrations)
- [Configuration](#configuration)
- [Docker Compose](#docker-compose)

---

## Quick Start

```bash
docker run -p 3001:3001 \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://user:password@host:5432/dismissible" \
  dismissibleio/dismissible-api:latest
```

The API will be available at `http://localhost:3001`.

### API Endpoints

| Endpoint                          | Method   | Description                          |
| --------------------------------- | -------- | ------------------------------------ |
| `/v1/users/:userId/items/:itemId` | `GET`    | Get or create a dismissible item     |
| `/v1/users/:userId/items/:itemId` | `DELETE` | Dismiss an item (marks as dismissed) |
| `/v1/users/:userId/items/:itemId` | `POST`   | Restore a previously dismissed item  |

The API documentation can be found at: [https://dismissible.io/docs/api](https://dismissible.io/docs/api)

A swagger version can be found at: [https://api.dismissible.io/docs](https://api.dismissible.io/docs)

---

## Getting Started

### Prerequisites

- PostgreSQL database (version 12 or higher) running and accessible

### Running the Container

Pull and run the official image:

```bash
docker run -d \
  --name dismissible-api \
  -p 3001:3001 \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://user:password@host:5432/dismissible" \
  dismissibleio/dismissible-api:latest
```

**Note**: [Database migrations](#database-migrations) run automatically on startup by default.

### Database Migrations

The API uses Prisma for database setup (eg. table creation) and migrations. By default, Prismamigrations are run automatically when the container starts.

If you would like better control over database setup and migrations, you can disable them from running when the container starts:

```bash
-e DISMISSIBLE_RUN_MIGRATION=false
```

Then you can run the migrations and database setup manually by:

```bash
docker run --rm \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://user:password@host:5432/dismissible" \
  dismissibleio/dismissible-api:latest \
  sh -c "cd /app/api && npm run prisma:migrate:deploy"
```

For more information about Prisma migrations, see the [Prisma documentation](https://www.prisma.io/docs/orm/prisma-migrations).

---

## Configuration

The dismissible docker image is highly configurable. The following environement variables can be set to control certain aspects of the app.

### Core Settings

| Variable                                         | Description                        | Default |
| ------------------------------------------------ | ---------------------------------- | ------- |
| `DISMISSIBLE_PORT`                               | Port the API listens on            | `3001`  |
| `DISMISSIBLE_SWAGGER_ENABLED`                    | Enable Swagger documentation       | `false` |
| `DISMISSIBLE_SWAGGER_PATH`                       | Swagger documentation path         | `""`    |
| `DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING` | PostgreSQL connection string       | `""`    |
| `DISMISSIBLE_RUN_MIGRATION`                      | Run database migrations on startup | `true`  |

### JWT Authentication

| Variable                                    | Description                            | Default  |
| ------------------------------------------- | -------------------------------------- | -------- |
| `DISMISSIBLE_JWT_AUTH_ENABLED`              | Enable JWT authentication              | `false`  |
| `DISMISSIBLE_JWT_AUTH_WELL_KNOWN_URL`       | OIDC well-known URL for JWKS discovery | `""`     |
| `DISMISSIBLE_JWT_AUTH_ISSUER`               | Expected issuer claim                  | `""`     |
| `DISMISSIBLE_JWT_AUTH_AUDIENCE`             | Expected audience claim                | `""`     |
| `DISMISSIBLE_JWT_AUTH_ALGORITHMS`           | Allowed algorithms (comma-separated)   | `RS256`  |
| `DISMISSIBLE_JWT_AUTH_JWKS_CACHE_DURATION`  | JWKS cache duration in ms              | `600000` |
| `DISMISSIBLE_JWT_AUTH_REQUEST_TIMEOUT`      | Request timeout in ms                  | `30000`  |
| `DISMISSIBLE_JWT_AUTH_PRIORITY`             | Hook priority (lower runs first)       | `-100`   |
| `DISMISSIBLE_JWT_AUTH_VERIFY_USER_ID_MATCH` | Verify userId matches JWT sub claim    | `true`   |

### Security (Helmet)

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

## Docker Compose

A simple setup with PostgreSQL:

```yaml
services:
  api:
    image: dismissibleio/dismissible-api:latest
    ports:
      - '3001:3001'
    environment:
      DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING: postgresql://postgres:postgres@dismissible-postgres:5432/dismissible
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: dismissible
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Start the services:

```bash
docker-compose up -d
```

---

## Additional Resources

- [Dismissible Website](https://dismissible.io)
- [Dismissible Documentation](https://dismissible.io/docs)
- [GitHub Repository](https://github.com/dismissible/dismissible-api)
