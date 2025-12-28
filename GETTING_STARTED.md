# Getting Started

Get the Dismissible API running in minutes with Docker.

## Prerequisites

- **Docker** installed on your machine
- **PostgreSQL** database (v12 or higher)

## Quick Start

### 1. Start a PostgreSQL Database

If you don't already have a PostgreSQL database running:

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=dismissible \
  -p 5432:5432 \
  postgres:15
```

### 2. Run the Dismissible API

```bash
docker run -p 3001:3001 \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://postgres:postgres@host.docker.internal:5432/dismissible" \
  dismissibleio/dismissible-api:latest
```

That's it! The API is now running at `http://localhost:3001`.

> **Note:** Use `host.docker.internal` to connect from inside Docker to the host machine. If both containers are on the same Docker network, use the container name instead (e.g., `postgres`).

### 3. Verify It's Working

```bash
curl http://localhost:3001/health
```

---

## Configuration Options

All configuration is done via environment variables prefixed with `DISMISSIBLE_`.

### Core Settings

| Variable                                         | Description                        | Default    |
| ------------------------------------------------ | ---------------------------------- | ---------- |
| `DISMISSIBLE_PORT`                               | Port the API listens on            | `3001`     |
| `DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING` | PostgreSQL connection string       | _required_ |
| `DISMISSIBLE_RUN_MIGRATION`                      | Run database migrations on startup | `false`    |
| `DISMISSIBLE_SWAGGER_ENABLED`                    | Enable Swagger API docs at `/api`  | `false`    |
| `DISMISSIBLE_SWAGGER_PATH`                       | Path for Swagger docs              | `""`       |

### JWT Authentication

Secure your API with any OIDC-compliant provider (Auth0, Okta, Keycloak, etc.).

| Variable                                   | Description                          | Default  |
| ------------------------------------------ | ------------------------------------ | -------- |
| `DISMISSIBLE_JWT_AUTH_ENABLED`             | Enable JWT authentication            | `false`  |
| `DISMISSIBLE_JWT_AUTH_WELL_KNOWN_URL`      | OIDC discovery URL                   | `""`     |
| `DISMISSIBLE_JWT_AUTH_ISSUER`              | Expected JWT issuer                  | `""`     |
| `DISMISSIBLE_JWT_AUTH_AUDIENCE`            | Expected JWT audience                | `""`     |
| `DISMISSIBLE_JWT_AUTH_ALGORITHMS`          | Allowed algorithms (comma-separated) | `RS256`  |
| `DISMISSIBLE_JWT_AUTH_JWKS_CACHE_DURATION` | JWKS cache duration (ms)             | `600000` |
| `DISMISSIBLE_JWT_AUTH_REQUEST_TIMEOUT`     | Request timeout (ms)                 | `30000`  |
| `DISMISSIBLE_JWT_AUTH_PRIORITY`            | Hook priority (lower runs first)     | `-100`   |

### CORS Settings

| Variable                           | Description                        | Default                                   |
| ---------------------------------- | ---------------------------------- | ----------------------------------------- |
| `DISMISSIBLE_CORS_ENABLED`         | Enable CORS                        | `true`                                    |
| `DISMISSIBLE_CORS_ORIGINS`         | Allowed origins (comma-separated)  | `http://localhost:3000`                   |
| `DISMISSIBLE_CORS_METHODS`         | Allowed HTTP methods               | `GET,POST,DELETE,OPTIONS`                 |
| `DISMISSIBLE_CORS_ALLOWED_HEADERS` | Allowed headers                    | `Content-Type,Authorization,x-request-id` |
| `DISMISSIBLE_CORS_CREDENTIALS`     | Allow credentials                  | `true`                                    |
| `DISMISSIBLE_CORS_MAX_AGE`         | Preflight cache duration (seconds) | `86400`                                   |

### Security Headers (Helmet)

| Variable                                     | Description                         | Default    |
| -------------------------------------------- | ----------------------------------- | ---------- |
| `DISMISSIBLE_HELMET_ENABLED`                 | Enable Helmet security headers      | `true`     |
| `DISMISSIBLE_HELMET_CSP`                     | Enable Content Security Policy      | `true`     |
| `DISMISSIBLE_HELMET_COEP`                    | Enable Cross-Origin Embedder Policy | `true`     |
| `DISMISSIBLE_HELMET_HSTS_MAX_AGE`            | HSTS max age (seconds)              | `31536000` |
| `DISMISSIBLE_HELMET_HSTS_INCLUDE_SUBDOMAINS` | Include subdomains in HSTS          | `true`     |
| `DISMISSIBLE_HELMET_HSTS_PRELOAD`            | Enable HSTS preload                 | `false`    |

### Validation Settings

| Variable                                        | Description                     | Default |
| ----------------------------------------------- | ------------------------------- | ------- |
| `DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES` | Hide detailed validation errors | `true`  |
| `DISMISSIBLE_VALIDATION_WHITELIST`              | Strip unknown properties        | `true`  |
| `DISMISSIBLE_VALIDATION_FORBID_NON_WHITELISTED` | Reject unknown properties       | `true`  |
| `DISMISSIBLE_VALIDATION_TRANSFORM`              | Auto-transform payloads to DTOs | `true`  |

---

## Common Setups

### Development (No Auth)

```bash
docker run -p 3001:3001 \
  -e DISMISSIBLE_RUN_MIGRATION=true \
  -e DISMISSIBLE_JWT_AUTH_ENABLED=false \
  -e DISMISSIBLE_SWAGGER_ENABLED=true \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://postgres:postgres@host.docker.internal:5432/dismissible" \
  dismissibleio/dismissible-api:latest
```

### Production (With Auth)

```bash
docker run -p 3001:3001 \
  -e DISMISSIBLE_RUN_MIGRATION=true \
  -e DISMISSIBLE_JWT_AUTH_ENABLED=true \
  -e DISMISSIBLE_JWT_AUTH_WELL_KNOWN_URL="https://your-tenant.auth0.com/.well-known/openid-configuration" \
  -e DISMISSIBLE_JWT_AUTH_ISSUER="https://your-tenant.auth0.com/" \
  -e DISMISSIBLE_JWT_AUTH_AUDIENCE="your-api-identifier" \
  -e DISMISSIBLE_CORS_ORIGINS="https://yourdomain.com" \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://user:password@db-host:5432/dismissible" \
  dismissibleio/dismissible-api:latest
```

### Using an Environment File

Create a `.env` file:

```bash
DISMISSIBLE_PORT=3001
DISMISSIBLE_RUN_MIGRATION=true
DISMISSIBLE_SWAGGER_ENABLED=true
DISMISSIBLE_JWT_AUTH_ENABLED=false
DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING=postgresql://postgres:postgres@host.docker.internal:5432/dismissible
DISMISSIBLE_CORS_ORIGINS=http://localhost:3000
```

Run with:

```bash
docker run --env-file .env -p 3001:3001 dismissibleio/dismissible-api:latest
```

---

## Next Steps

- View the [Docker Guide](docs/DOCKER.md) for advanced deployment options
- See the [NPM API Documentation](docs/NPM_API.md) for NestJS module integration
- Check out the [README](README.md) for full project documentation
