# Docker Guide

This guide covers building, running, and deploying the Dismissible API using Docker.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Database Schema Setup](#database-schema-setup)
- [Using the Official Image](#using-the-official-image)
- [Building from Source](#building-from-source)
- [Running the Container](#running-the-container)
- [Environment Variables](#environment-variables)
- [Docker Compose](#docker-compose)
- [Multi-Platform Builds](#multi-platform-builds)
- [Health Checks](#health-checks)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

The fastest way to get started with Docker:

**Important**: Before starting the API, you must set up the database schema. See [Database Schema Setup](#database-schema-setup) below.

```bash
# Using the official image
docker run -p 3001:3001 \
  -e DISMISSIBLE_JWT_AUTH_ENABLED=false \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://user:password@host:5432/dismissible" \
  dismissibleio/dismissible-api:latest

# Or build and run locally
docker build -t dismissible-api .
docker run -p 3001:3001 \
  -e DISMISSIBLE_JWT_AUTH_ENABLED=false \
  -e DISMISSIBLE_RUN_MIGRATION=true \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://postgres:postgres@host.docker.internal:5432/dismissible" \
  dismissible-api
```

> Set `DISMISSIBLE_JWT_AUTH_ENABLED=true` and configure your OIDC provider for production use.

---

## Database Schema Setup

**CRITICAL**: The database schema **must** be initialized before starting the API container. The API will fail to start if the database tables don't exist.

### What This Does

Running migrations creates the necessary database tables (specifically the `DismissibleItem` table) that the API requires to function. Without these tables, the API cannot store or retrieve dismissible items.

### Prerequisites

- PostgreSQL database (version 12 or higher) must be running and accessible
- Database connection string configured in `DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING`
- Database user must have permissions to create tables and run migrations

### Development: Using `prisma db push`

For development and testing, use `prisma db push` to quickly sync the schema without creating migration files:

```bash
# Run schema push in a temporary container
# This creates the database tables directly from the schema
docker run --rm \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://user:password@host:5432/dismissible" \
  dismissibleio/dismissible-api:latest \
  sh -c "cd /app/api && npm run prisma:db:push -- --accept-data-loss"
```

**What happens:**

- The schema is pushed directly to the database
- Tables are created or updated to match the schema
- No migration files are created
- Fast and convenient for development

> **Warning**: `prisma db push` is for development only. It may cause data loss and doesn't create version-controlled migration files. **Never use this in production.**

### Production: Using Prisma Migrations

For production deployments, use Prisma migrations to safely apply schema changes:

#### Step 1: Generate Migration Files (First Time Setup)

If this is the first deployment, you'll need to create the initial migration. This is typically done during development:

```bash
# From your development environment (not in Docker)
cd api
npm run prisma:migrate:dev -- --name init
```

This creates migration files in `libs/postgres-storage/prisma/migrations/` that should be included in your Docker image.

#### Step 2: Apply Migrations in Production

**CRITICAL**: Run migrations **before** starting the API container. The API requires the database tables to exist.

```bash
# Apply all pending migrations
# This creates the DismissibleItem table and any other required tables
docker run --rm \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://user:password@host:5432/dismissible" \
  dismissibleio/dismissible-api:latest \
  sh -c "cd /app/api && npm run prisma:migrate:deploy"
```

**What this does:**

- Applies all pending migrations from `libs/postgres-storage/prisma/migrations/` to the database
- Creates the `DismissibleItem` table and any indexes
- Safe for production (no data loss)
- Idempotent (safe to run multiple times - already applied migrations are skipped)
- Only applies migrations that haven't been run yet

**Expected output:**

```
Applied migration: 20240101000000_init
All migrations have been successfully applied.
```

If you see this output, the schema is ready and you can start the API container.

#### Step 3: Verify Schema

Verify the schema was created correctly:

```bash
# Check database tables
docker run --rm \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://user:password@host:5432/dismissible" \
  dismissibleio/dismissible-api:latest \
  sh -c "cd /app && npx dismissible-prisma db execute --stdin" <<< "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
```

### Automatic Migrations on Startup

For convenience, you can enable automatic migrations to run before the API starts by setting `DISMISSIBLE_RUN_MIGRATION=true`:

```bash
docker run -p 3001:3001 \
  -e DISMISSIBLE_RUN_MIGRATION=true \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://user:password@host:5432/dismissible" \
  dismissibleio/dismissible-api:latest
```

**What happens:**

- Migrations run automatically before the application starts
- Uses `npm run prisma:migrate:deploy` (production-safe, idempotent)
- If migrations fail, the container exits and the application won't start
- Convenient for simple deployments where you want migrations to run automatically

> **When to use automatic migrations:**
>
> - Simple deployments where you control the database lifecycle
> - Development and testing environments
> - Single-container deployments
>
> **When NOT to use automatic migrations:**
>
> - Multi-container deployments where you want to run migrations separately
> - CI/CD pipelines where you want explicit migration steps
> - Production environments where you want to verify migrations before starting the API
> - When using orchestration tools (Kubernetes, Docker Compose) that can run migrations as a separate job

### Automated Migration Script

For production deployments, create a migration script:

```bash
#!/bin/bash
# migrate.sh

set -e

CONNECTION_STRING="${DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING}"

if [ -z "$CONNECTION_STRING" ]; then
  echo "Error: DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING is not set"
  exit 1
fi

echo "Running database migrations..."
docker run --rm \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="$CONNECTION_STRING" \
  dismissibleio/dismissible-api:latest \
  sh -c "cd /app/api && npm run prisma:migrate:deploy"

echo "Migrations completed successfully!"
```

Usage:

```bash
export DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://user:password@host:5432/dismissible"
chmod +x migrate.sh
./migrate.sh
```

### Migration Best Practices

1. **Always run migrations before starting the API** - The API requires the schema to exist. The API will fail to start if tables don't exist.
2. **Use `migrate deploy` in production** - Never use `migrate dev` or `db push` in production
3. **Choose your migration strategy** - Either run migrations manually before starting the API, or enable `DISMISSIBLE_RUN_MIGRATION=true` for automatic migrations on startup
4. **Test migrations in staging first** - Always test schema changes before production
5. **Backup before migrations** - Take a database backup before applying migrations
6. **Monitor migration logs** - Check migration output for any errors or warnings
7. **Verify schema after migrations** - Confirm tables exist before starting the API (see Step 3 above)

### Troubleshooting Migrations

**Error: "Migration engine failed to connect"**

- Verify the connection string is correct
- Ensure the database is accessible from the container
- Check network connectivity and firewall rules

**Error: "Migration failed to apply"**

- Check database logs for detailed error messages
- Ensure you have the latest migration files in the image
- Verify database user has sufficient permissions

**Error: "Migration already applied"**

- This is normal - `migrate deploy` is idempotent
- The migration will be skipped if already applied

---

## Using the Official Image

Pull the official image from Docker Hub:

```bash
docker pull dismissibleio/dismissible-api:latest
```

Available tags:

| Tag      | Description                      |
| -------- | -------------------------------- |
| `latest` | Latest stable release            |
| `x.y.z`  | Specific version (e.g., `1.0.0`) |
| `main`   | Latest build from main branch    |

---

## Building from Source

### Basic Build

Build the Docker image from the project root:

```bash
docker build -t dismissible-api .
```

### Build with Custom Tag

```bash
docker build -t dismissible-api:v1.0.0 .
```

### Build with No Cache

Force a fresh build without using cached layers:

```bash
docker build --no-cache -t dismissible-api .
```

### Understanding the Dockerfile

The Dockerfile uses a **multi-stage build** for optimal image size and security:

**Stage 1: Builder**

- Uses `node:24-alpine` as the base image
- Installs build dependencies (Python, Make, G++)
- Installs npm dependencies
- Generates Prisma client
- Builds the application
- Prunes development dependencies

**Stage 2: Production**

- Uses `node:24-alpine` as a minimal base
- Creates a non-root user (`nestjs`) for security
- Copies only production dependencies and built files
- Configures health checks
- Sets secure defaults

---

## Running the Container

### Basic Run

```bash
docker run -p 3001:3001 dismissible-api
```

### Run with Environment Variables

```bash
docker run -p 3001:3001 \
  -e DISMISSIBLE_PORT=3001 \
  -e DISMISSIBLE_SWAGGER_ENABLED=true \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://user:password@host:5432/dismissible" \
  dismissible-api
```

### Run in Detached Mode

```bash
docker run -d --name dismissible-api -p 3001:3001 dismissible-api
```

### Run with Restart Policy

```bash
docker run -d --restart unless-stopped --name dismissible-api -p 3001:3001 dismissible-api
```

### View Logs

```bash
docker logs dismissible-api

# Follow logs in real-time
docker logs -f dismissible-api
```

### Stop and Remove Container

```bash
docker stop dismissible-api
docker rm dismissible-api
```

---

## Environment Variables

The following environment variables can be configured:

### Core Settings

| Variable                                         | Description                                             | Default |
| ------------------------------------------------ | ------------------------------------------------------- | ------- |
| `DISMISSIBLE_PORT`                               | Port the API listens on                                 | `3001`  |
| `DISMISSIBLE_SWAGGER_ENABLED`                    | Enable Swagger documentation                            | `false` |
| `DISMISSIBLE_SWAGGER_PATH`                       | Swagger documentation path                              | `""`    |
| `DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING` | PostgreSQL connection string                            | `""`    |
| `DISMISSIBLE_RUN_MIGRATION`                      | Run database migrations before starting the application | `false` |

### JWT Authentication

Enable JWT authentication to secure your API endpoints with OIDC-compliant identity providers (Auth0, Okta, Keycloak, etc.).

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

> Set `DISMISSIBLE_JWT_AUTH_ENABLED=false` to disable JWT authentication entirely (useful for development).

### Security (Helmet)

| Variable                                     | Description                    | Default    |
| -------------------------------------------- | ------------------------------ | ---------- |
| `DISMISSIBLE_HELMET_ENABLED`                 | Enable Helmet security headers | `true`     |
| `DISMISSIBLE_HELMET_CSP`                     | Enable Content Security Policy | `true`     |
| `DISMISSIBLE_HELMET_COEP`                    | Enable Cross-Origin Embedder   | `true`     |
| `DISMISSIBLE_HELMET_HSTS_MAX_AGE`            | HSTS max age in seconds        | `31536000` |
| `DISMISSIBLE_HELMET_HSTS_INCLUDE_SUBDOMAINS` | Include subdomains in HSTS     | `true`     |
| `DISMISSIBLE_HELMET_HSTS_PRELOAD`            | Enable HSTS preload            | `false`    |

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

Configure NestJS ValidationPipe behavior for request validation.

| Variable                                        | Description                                                  | Default |
| ----------------------------------------------- | ------------------------------------------------------------ | ------- |
| `DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES` | Disable detailed error messages (recommended for production) | `true`  |
| `DISMISSIBLE_VALIDATION_WHITELIST`              | Strip non-whitelisted properties from validated objects      | `true`  |
| `DISMISSIBLE_VALIDATION_FORBID_NON_WHITELISTED` | Throw error instead of stripping non-whitelisted properties  | `true`  |
| `DISMISSIBLE_VALIDATION_TRANSFORM`              | Automatically transform payloads to DTO instances            | `true`  |

> **Security Note**: Set `DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES=true` in production to prevent information disclosure through detailed validation error messages.

### Using an Environment File

Create a `.env` file:

```bash
DISMISSIBLE_PORT=3001
DISMISSIBLE_SWAGGER_ENABLED=true
DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING=postgresql://postgres:postgres@localhost:5432/dismissible
DISMISSIBLE_CORS_ORIGINS=http://localhost:3000,https://myapp.com
DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES=true
```

Run with the env file:

```bash
docker run --env-file .env -p 3001:3001 dismissible-api
```

---

## Docker Compose

### Development Setup

The included `docker-compose.yml` provides a complete local development environment:

```bash
# Step 1: Start the database
docker-compose up -d dismissible-postgres

# Step 2: Wait for database to be ready (optional, but recommended)
sleep 5

# Step 3: Set up the database schema
docker-compose run --rm dismissible-api \
  sh -c "cd /app/api && npm run prisma:db:push -- --accept-data-loss"

# Step 4: Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v
```

> **Tip**: For development, `prisma db push` is convenient as it automatically syncs your schema. For production, always use migrations.

### Services

| Service                | Description         | Port |
| ---------------------- | ------------------- | ---- |
| `dismissible-api`      | The Dismissible API | 3001 |
| `dismissible-postgres` | PostgreSQL database | 5432 |

### Custom Docker Compose

Create a custom `docker-compose.prod.yml` for production:

```yaml
services:
  # Migration service - runs before API starts
  migrate:
    image: dismissibleio/dismissible-api:latest
    environment:
      DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING: ${DATABASE_URL}
    command: sh -c "cd /app/api && npm run prisma:migrate:deploy"
    depends_on:
      db:
        condition: service_healthy
    restart: 'no' # Run once, then exit
    networks:
      - dismissible-network

  api:
    image: dismissibleio/dismissible-api:latest
    restart: always
    ports:
      - '3001:3001'
    environment:
      DISMISSIBLE_PORT: 3001
      DISMISSIBLE_SWAGGER_ENABLED: false
      DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING: ${DATABASE_URL}
      DISMISSIBLE_CORS_ORIGINS: https://yourdomain.com
      DISMISSIBLE_HELMET_ENABLED: true
      DISMISSIBLE_HELMET_CSP: true
      DISMISSIBLE_HELMET_COEP: true
      DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES: true
    depends_on:
      migrate:
        condition: service_completed_successfully
      db:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'wget', '--spider', '-q', 'http://localhost:3001/health']
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
    networks:
      - dismissible-network

  db:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: dismissible
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER} -d dismissible']
      interval: 5s
      timeout: 3s
      retries: 5
    # Don't expose PostgreSQL in production
    # ports:
    #   - '5432:5432'
    networks:
      - dismissible-network

volumes:
  postgres_data:

networks:
  dismissible-network:
    driver: bridge
```

Run with:

```bash
# Migrations will run automatically before API starts
docker-compose -f docker-compose.prod.yml up -d

# Or run migrations manually first
docker-compose -f docker-compose.prod.yml run --rm migrate
docker-compose -f docker-compose.prod.yml up -d api
```

---

## Multi-Platform Builds

Build for multiple architectures using Docker Buildx:

### Setup Buildx

```bash
# Create a new builder instance
docker buildx create --name multiarch --use

# Bootstrap the builder
docker buildx inspect --bootstrap
```

### Build for Multiple Platforms

```bash
# Build for AMD64 and ARM64
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t dismissible-api:latest \
  --push \
  .
```

### Build for Specific Platform

```bash
# Build for ARM64 only (e.g., Apple Silicon, AWS Graviton)
docker buildx build --platform linux/arm64 -t dismissible-api:arm64 .

# Build for AMD64 only
docker buildx build --platform linux/amd64 -t dismissible-api:amd64 .
```

---

## Health Checks

The Docker image includes a built-in health check that monitors the `/health` endpoint.

### Health Check Configuration

| Parameter    | Value                             |
| ------------ | --------------------------------- |
| Interval     | 30 seconds                        |
| Timeout      | 3 seconds                         |
| Start Period | 5 seconds                         |
| Retries      | 3                                 |
| Endpoint     | `http://localhost:${PORT}/health` |

### Check Container Health

```bash
# View health status
docker inspect --format='{{.State.Health.Status}}' dismissible-api

# View recent health check results
docker inspect --format='{{json .State.Health}}' dismissible-api | jq
```

### Manual Health Check

```bash
# From host
curl http://localhost:3001/health

# From inside container
docker exec dismissible-api wget -qO- http://localhost:3001/health
```

---

## Production Deployment

### Security Best Practices

1. **Non-root User**: The container runs as a non-root user (`nestjs:nodejs`) by default
2. **Minimal Image**: Uses Alpine-based image with only production dependencies
3. **Security Headers**: Enable Helmet with appropriate CSP settings
4. **Network Isolation**: Use Docker networks to isolate services

### Resource Limits

Set memory and CPU limits:

```bash
docker run -d \
  --memory=512m \
  --cpus=1 \
  -p 3001:3001 \
  dismissible-api
```

Or in Docker Compose:

```yaml
services:
  api:
    image: dismissibleio/dismissible-api:latest
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Logging

Configure log driver for production:

```yaml
services:
  api:
    image: dismissibleio/dismissible-api:latest
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'
```

### Database Migrations

**CRITICAL**: Database migrations must be run before starting the API container in production.

You have two options for running migrations:

1. **Automatic migrations on startup** - Set `DISMISSIBLE_RUN_MIGRATION=true` (simpler, but less control)
2. **Manual migrations** - Run migrations separately before starting the API (more control, recommended for production)

#### Option 1: Automatic Migrations (Simpler)

Enable automatic migrations by setting `DISMISSIBLE_RUN_MIGRATION=true`:

```bash
docker run -d --name dismissible-api \
  -p 3001:3001 \
  -e DISMISSIBLE_RUN_MIGRATION=true \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://user:password@host:5432/dismissible" \
  dismissibleio/dismissible-api:latest
```

The container will automatically run migrations before starting the API. If migrations fail, the container will exit.

#### Option 2: Manual Migrations (Recommended for Production)

**Step 1: Ensure Database is Running**

```bash
# Verify your PostgreSQL database is accessible
psql "$DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING" -c "SELECT version();"
```

**Step 2: Run Migrations**

```bash
# Apply all pending migrations
docker run --rm \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://user:password@host:5432/dismissible" \
  dismissibleio/dismissible-api:latest \
  sh -c "cd /app/api && npm run prisma:migrate:deploy"
```

**Step 3: Verify Migration Success**

Check the migration output for success messages. You should see:

```
Applied migration: 20240101000000_init
```

**Step 4: Start the API**

Only after migrations complete successfully:

```bash
docker run -d --name dismissible-api \
  -p 3001:3001 \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://user:password@host:5432/dismissible" \
  dismissibleio/dismissible-api:latest
```

#### Using Docker Compose for Production

For production deployments with Docker Compose, add a migration service:

```yaml
services:
  migrate:
    image: dismissibleio/dismissible-api:latest
    environment:
      DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING: ${DATABASE_URL}
    command: sh -c "cd /app/api && npm run prisma:migrate:deploy"
    depends_on:
      - db
    restart: 'no' # Run once, then exit

  api:
    image: dismissibleio/dismissible-api:latest
    depends_on:
      migrate:
        condition: service_completed_successfully
      db:
        condition: service_healthy
    # ... rest of configuration
```

Run migrations before starting services:

```bash
# Run migrations
docker-compose run --rm migrate

# Start all services (API will wait for migrations)
docker-compose up -d
```

#### CI/CD Integration

For automated deployments, include migration steps in your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run database migrations
  run: |
    docker run --rm \
      -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="${{ secrets.DATABASE_URL }}" \
      dismissibleio/dismissible-api:latest \
      sh -c "cd /app/api && npm run prisma:migrate:deploy"

- name: Deploy API
  run: |
    docker run -d --name dismissible-api \
      -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="${{ secrets.DATABASE_URL }}" \
      dismissibleio/dismissible-api:latest
```

#### Migration Safety

- **Safe**: `npm run prisma:migrate:deploy` - Idempotent, production-safe
- **Unsafe**: `npm run prisma:migrate:dev` - Creates new migrations, not for production
- **Unsafe**: `npm run prisma:db:push` - May cause data loss, development only

> **Security**: Never expose your database connection string in logs or commit it to version control. Use environment variables or secrets management.

---

## Troubleshooting

### Container Won't Start

Check logs for errors:

```bash
docker logs dismissible-api
```

Common issues:

- **Database connection failed**: Verify `DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING` is correct
- **Port already in use**: Change `DISMISSIBLE_PORT` or host port mapping
- **Schema not found**: Run database migrations before starting the API (see [Database Schema Setup](#database-schema-setup))
- **Migration errors**: Check database logs and ensure connection string has proper permissions

### Health Check Failing

```bash
# Check if the app is responding
docker exec dismissible-api wget -qO- http://localhost:3001/health

# Check container logs
docker logs dismissible-api --tail 50
```

### Database Connection Issues

When using Docker Compose, ensure you're using the service name as the hostname:

```bash
# Correct (using service name)
DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING=postgresql://postgres:postgres@dismissible-postgres:5432/dismissible

# Incorrect (using localhost)
DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING=postgresql://postgres:postgres@localhost:5432/dismissible
```

### Out of Memory

If the container is killed due to OOM:

1. Increase memory limit
2. Check for memory leaks in application logs
3. Monitor memory usage: `docker stats dismissible-api`

### Slow Builds on ARM (Apple Silicon)

When building on ARM-based machines, the build may be slow due to QEMU emulation. Build natively on ARM:

```bash
# Build for native platform only
docker build -t dismissible-api .

# Or explicitly specify ARM64
docker buildx build --platform linux/arm64 -t dismissible-api .
```

### Cleaning Up

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove all unused Docker resources
docker system prune -a
```

---

## Additional Resources

- [Main README](../README.md) - Project overview and quick start
- [NPM API Documentation](./NPM_API.md) - NestJS module integration
- [Docker Hub](https://hub.docker.com/r/dismissibleio/dismissible-api) - Official Docker images
- [GitHub Repository](https://github.com/dismissible/dismissible-api) - Source code
