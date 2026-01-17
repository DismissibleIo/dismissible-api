# Dismissible API - Docker image

[Dismissible Website](https://dismissible.io)

Dismissible manages the state of your UI elements across sessions, so your users see what matters, once! No more onboarding messages reappearing on every tab, no more notifications haunting users across devices. Dismissible syncs dismissal state everywhere, so every message is intentional, never repetitive.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Running the Container](#running-the-container)
  - [Storage Setup](#storage-setup)
- [Storage Backends](#storage-backends)
  - [PostgreSQL](#postgresql)
  - [DynamoDB](#dynamodb)
  - [In-Memory](#memory)
- [Configuration](#configuration)
- [Docker Compose](#docker-compose)

---

## Quick Start

### PostgreSQL (Default)

```bash
docker run -p 3001:3001 \
  -e DISMISSIBLE_STORAGE_TYPE=postgres \
  -e DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING="postgresql://user:password@host:5432/dismissible" \
  dismissibleio/dismissible-api:latest
```

The API will be available at `http://localhost:3001`.

### API Endpoints

| Endpoint                          | Method   | Description                                 |
| --------------------------------- | -------- | ------------------------------------------- |
| `/v1/users/:userId/items/:itemId` | `GET`    | Get or create a dismissible item            |
| `/v1/users/:userId/items/:itemId` | `DELETE` | Dismiss an item (marks as dismissed)        |
| `/v1/users/:userId/items/:itemId` | `POST`   | Restore a previously dismissed item         |
| `/v1/users/:userId/items`         | `POST`   | Batch get or create multiple items (max 50) |

The API documentation can be found at: [https://dismissible.io/docs/api](https://dismissible.io/docs/api)

A swagger version can be found at: [https://api.dismissible.io/docs](https://api.dismissible.io/docs)

---

## Getting Started

### Prerequisites

Depending on your chosen storage backend, you'll need:

- **PostgreSQL**: PostgreSQL database (version 12 or higher) running and accessible
- **DynamoDB**: AWS account with DynamoDB access, or a local DynamoDB instance
- **In-Memory**: No prerequisites (data stored in process memory)

### Running the Container

The fastest way to get started is by using the public [Docker image](https://hub.docker.com/r/dismissibleio/dismissible-api) which contains the Dismissible API and storage adapters.

```bash
docker run -p 3001:3001 \
  -e DISMISSIBLE_STORAGE_TYPE=memory \
  dismissibleio/dismissible-api:latest
```

This will launch the API using the memory storage, and will now be available at `http://localhost:3001`.

## Storage Backends

The Dismissible API supports multiple storage backends and is determined by the following config:

| Variable                   | Description                                               | Default    |
| -------------------------- | --------------------------------------------------------- | ---------- |
| `DISMISSIBLE_STORAGE_TYPE` | Storage backend type eg. `postgres`, `dynamodb`, `memory` | `postgres` |

### PostgreSQL

The default and most production-ready option. Uses Prisma ORM for database operations.

**Environment Variables:**

| Variable                                         | Description                  | Default    |
| ------------------------------------------------ | ---------------------------- | ---------- |
| `DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING` | PostgreSQL connection string | _required_ |

**Example:**

```bash
docker run -p 3001:3001 \
  -e DISMISSIBLE_STORAGE_TYPE=postgres \
  -e DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING="postgresql://user:password@host:5432/dismissible" \
  -e DISMISSIBLE_STORAGE_RUN_SETUP=true \
  dismissibleio/dismissible-api:latest
```

### DynamoDB

AWS DynamoDB storage backend for serverless or AWS-native deployments.

**Environment Variables:**

| Variable                                             | Description                            | Default             |
| ---------------------------------------------------- | -------------------------------------- | ------------------- |
| `DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME`            | DynamoDB table name                    | `dismissible-items` |
| `DISMISSIBLE_STORAGE_DYNAMODB_AWS_REGION`            | AWS region                             | `us-east-1`         |
| `DISMISSIBLE_STORAGE_DYNAMODB_AWS_ACCESS_KEY_ID`     | AWS access key ID                      | -                   |
| `DISMISSIBLE_STORAGE_DYNAMODB_AWS_SECRET_ACCESS_KEY` | AWS secret access key                  | -                   |
| `DISMISSIBLE_STORAGE_DYNAMODB_AWS_SESSION_TOKEN`     | AWS session token                      | -                   |
| `DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT`              | LocalStack/DynamoDB Local endpoint URL | -                   |

**Example:**

This example would be similar to a production deployment

```bash
docker run -p 3001:3001 \
  -e DISMISSIBLE_STORAGE_TYPE=dynamodb \
  -e DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME="items" \
  -e DISMISSIBLE_STORAGE_DYNAMODB_REGION="us-east-1" \
  -e AWS_ACCESS_KEY_ID="your-access-key" \
  -e AWS_SECRET_ACCESS_KEY="your-secret-key" \
  dismissibleio/dismissible-api:latest
```

**Local DynamoDB:**

To use a local DynamoDB instance (e.g., Dockerized DynamoDB):

```bash
docker run -p 3001:3001 \
  -e DISMISSIBLE_STORAGE_TYPE=dynamodb \
  -e DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME="items" \
  -e DISMISSIBLE_STORAGE_DYNAMODB_REGION="localhost" \
  -e DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT="http://localhost:8000" \
  -e DISMISSIBLE_STORAGE_DYNAMODB_ACCESS_KEY="local" \
  -e DISMISSIBLE_STORAGE_DYNAMODB_SECRET_KEY="local" \
  dismissibleio/dismissible-api:latest
```

### In-Memory

In-process memory storage for development, testing, or single-instance deployments. Uses an LRU (Least Recently Used) cache.

**Environment Variables:**

| Variable                               | Description                      | Default    |
| -------------------------------------- | -------------------------------- | ---------- |
| `DISMISSIBLE_STORAGE_TYPE`             | Storage backend type (`memory`)  | -          |
| `DISMISSIBLE_STORAGE_MEMORY_MAX_ITEMS` | Maximum number of items to store | `5000`     |
| `DISMISSIBLE_STORAGE_MEMORY_TTL_MS`    | Time-to-live in milliseconds     | `21600000` |

**Example:**

```bash
docker run -p 3001:3001 \
  -e DISMISSIBLE_STORAGE_TYPE=memory \
  dismissibleio/dismissible-api:latest
```

**Example with custom limits:**

```bash
docker run -p 3001:3001 \
  -e DISMISSIBLE_STORAGE_TYPE=memory \
  -e DISMISSIBLE_STORAGE_MEMORY_MAX_ITEMS=10000 \
  -e DISMISSIBLE_STORAGE_MEMORY_TTL_MS=43200000 \
  dismissibleio/dismissible-api:latest
```

**Warning**: Data stored in memory will be lost when the container restarts. Do not use in production or for multi-instance deployments.

---

## Configuration

The dismissible docker image is highly configurable. The following environment variables can be set to control certain aspects of the app.

For a full list of all configuration, see the [documentation here](./CONFIGURATION.md).

## Docker Compose

### PostgreSQL Setup

A simple setup with PostgreSQL:

```yaml
services:
  api:
    image: dismissibleio/dismissible-api:latest
    ports:
      - '3001:3001'
    environment:
      DISMISSIBLE_STORAGE_TYPE: postgres
      DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING: postgresql://postgres:postgres@dismissible-postgres:5432/dismissible
      DISMISSIBLE_STORAGE_RUN_SETUP: 'true'
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

### DynamoDB Setup

A setup with local DynamoDB:

```yaml
services:
  api:
    image: dismissibleio/dismissible-api:latest
    ports:
      - '3001:3001'
    environment:
      DISMISSIBLE_STORAGE_TYPE: dynamodb
      DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME: dismissible-items
      DISMISSIBLE_STORAGE_DYNAMODB_REGION: us-east-1
      DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT: http://dismissible-dynamodb:4566
      DISMISSIBLE_STORAGE_DYNAMODB_ACCESS_KEY: test
      DISMISSIBLE_STORAGE_DYNAMODB_SECRET_KEY: test
    depends_on:
      - dismissible-dynamodb

  dismissible-dynamodb:
    image: localstack/localstack:latest
    container_name: dismissible-dynamodb
    restart: unless-stopped
    environment:
      SERVICES: dynamodb
      AWS_DEFAULT_REGION: us-east-1
      DEBUG: 0
      # Persistence mode (optional - data persists across restarts)
      # PERSISTENCE: 1
    ports:
      - '4566:4566'
```

### In-Memory Setup

A simple setup with memory storage:

```yaml
services:
  api:
    image: dismissibleio/dismissible-api:latest
    ports:
      - '3001:3001'
    environment:
      DISMISSIBLE_STORAGE_TYPE: memory
      DISMISSIBLE_STORAGE_MEMORY_MAX_ITEMS: 5000
      DISMISSIBLE_STORAGE_MEMORY_TTL_MS: 21600000
```

### With Rate Limiting

Add rate limiting to protect your API from abuse:

```yaml
services:
  api:
    image: dismissibleio/dismissible-api:latest
    ports:
      - '3001:3001'
    environment:
      DISMISSIBLE_STORAGE_TYPE: postgres
      DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING: postgresql://postgres:postgres@dismissible-postgres:5432/dismissible
      DISMISSIBLE_STORAGE_RUN_SETUP: 'true'
      # Rate limiting: 1000 requests per second
      DISMISSIBLE_RATE_LIMITER_ENABLED: 'true'
      DISMISSIBLE_RATE_LIMITER_POINTS: 1000
      DISMISSIBLE_RATE_LIMITER_DURATION: 1
      DISMISSIBLE_RATE_LIMITER_BLOCK_DURATION: 60
      DISMISSIBLE_RATE_LIMITER_KEY_TYPE: 'ip,origin,referrer'
      DISMISSIBLE_RATE_LIMITER_KEY_MODE: 'any'
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
