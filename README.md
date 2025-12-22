# Dismissible API

> **Never Show The Same Thing Twice**

Dismissible manages the state of your UI elements across sessions, so your users see what matters, once! No more onboarding messages reappearing on every tab, no more notifications haunting users across devices. Dismissible syncs dismissal state everywhere, so every message is intentional, never repetitive.

## Two Parts to Dismissible

Dismissible consists of two components:

1. **The API** (this repository) - Maintains all the dismissal state and provides a REST API for managing dismissible items
2. **The Client** - Handles the UI and communicates with the API
   - React: [`@dismissible/react-client`](https://www.npmjs.com/package/@dismissible/react-client) ([GitHub](https://github.com/DismissibleIo/dismissible-react-client))

**Visit [dismissible.io](https://dismissible.io)** for documentation, help, and support.

---

## Open Source & Free

This project is **100% open source** and **free to use**. Self-host the API with full control over your data, or use our [hosted service](https://dismissible.io) for zero-config convenience.

---

## Quick Start

### Option 1: Docker (Recommended)

The fastest way to get started. The Docker image requires a PostgreSQL database and automatically creates the necessary tables on startup.

```bash
docker run -p 3001:3001 \
  -e DISMISSIBLE_RUN_MIGRATION=true \
  -e DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING="postgresql://user:password@host:5432/dismissible" \
  dismissibleio/dismissible-api:latest
```

The API will be available at `http://localhost:3001`.

> **Full Docker Documentation**: See [GETTING_STARTED.md](./GETTING_STARTED.md) for basic setup, or [docs/DOCKER.md](./docs/DOCKER.md) for complete deployment instructions, configuration options, and production setup.

### Option 2: NestJS Module

Install the NestJS API module directly into your existing NestJS application:

```bash
npm install @dismissible/nestjs-api
```

Then import and configure in your NestJS app:

```typescript
import { DismissibleModule } from '@dismissible/nestjs-api';
import { PostgresStorageModule } from '@dismissible/nestjs-postgres-storage';

@Module({
  imports: [
    DismissibleModule.forRoot({
      storage: PostgresStorageModule,
    }),
  ],
})
export class AppModule {}
```

> **Full Documentation**: See [docs/NPM_API.md](./docs/NPM_API.md) for complete details on hooks, events, custom storage adapters, and more.

---

## API Endpoints

| Endpoint                            | Method   | Description                                                |
| ----------------------------------- | -------- | ---------------------------------------------------------- |
| `/health`                           | `GET`    | Health check endpoint                                      |
| `/v1/users/{userId}/items/{itemId}` | `GET`    | Get or create a dismissible item (creates if non-existent) |
| `/v1/users/{userId}/items/{itemId}` | `DELETE` | Dismiss an item                                            |
| `/v1/users/{userId}/items/{itemId}` | `POST`   | Restore a previously dismissed item                        |

> Enable Swagger documentation by setting `DISMISSIBLE_SWAGGER_ENABLED=true` and visit `/api` for interactive API docs.

---

## Documentation

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Quick start guide with Docker setup and all configuration options
- **[docs/DOCKER.md](./docs/DOCKER.md)** - Complete Docker deployment guide with production best practices
- **[docs/NPM_API.md](./docs/NPM_API.md)** - NestJS module integration guide with hooks, events, and custom storage

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  <a href="https://dismissible.io">dismissible.io</a> · 
  <a href="https://github.com/dismissible/dismissible-api">GitHub</a>
</p>
