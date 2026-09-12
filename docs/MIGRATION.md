# Migrating from v3 to v4

This guide covers upgrading from v3.1.1 to v4 of the published
`@dismissible/*` npm packages or `dismissibleio/dismissible-api` Docker image.
The commands below apply once v4 is published.

## Docker image users

**Update the image tag and redeploy with your existing configuration. No
application configuration or data migration is required by this update.**

Use the published v4 image tag in your deployment. Keep your current environment
variables, ports, storage connections, and cache settings. The new image includes
its own Node.js runtime and dependencies; you do not need to install or upgrade
Node.js on the Docker host.

The update does not change:

- Supported environment-variable names or their image defaults.
- HTTP routes, request/response formats, or authentication configuration.
- PostgreSQL schema/migrations or DynamoDB table keys.
- Cache keys, prefixes, or TTL units.

You can continue using your existing PostgreSQL, DynamoDB, and Redis services.
Upgrading the API image does not require replacing these services or their data
volumes. The startup setup flag remains `DISMISSIBLE_STORAGE_RUN_SETUP`, with a
default of `true`.

After redeploying, check `GET /health` and read an existing item, then verify
create/dismiss/restore with a test item.

## npm package users

### 1. Upgrade your Dismissible packages together

Update every direct `@dismissible/*` dependency in your application to v4. For
example, if you use the core module and PostgreSQL adapter:

```bash
npm install @dismissible/nestjs-core@^4 @dismissible/nestjs-postgres-storage@^4
```

If you use the all-in-one API package:

```bash
npm install @dismissible/nestjs-api@^4
```

Include any other Dismissible packages you use in the same upgrade and commit
your application's updated lockfile.

### 2. Align your application's peer dependencies

**NestJS 10 support has been removed.** Applications using NestJS 10 must upgrade
to NestJS 11 before adopting Dismissible v4. NestJS 12 is outside the supported
peer ranges.

| Dependency        | v3 requirement         | v4 requirement | Affected packages                                                |
| ----------------- | ---------------------- | -------------- | ---------------------------------------------------------------- |
| `@nestjs/common`  | `^10.0.0 \|\| ^11.0.0` | `^11.0.0`      | All libraries that declare a NestJS common peer                  |
| `@nestjs/core`    | `^10.0.0 \|\| ^11.0.0` | `^11.0.0`      | Core, logger, JWT auth hook, rate limiter hook                   |
| `@nestjs/swagger` | `^10.0.0 \|\| ^11.0.0` | `^11.0.0`      | Core, item                                                       |
| `fastify`         | No direct core peer    | `^5.12.3`      | Core; newly required peer                                        |
| `class-validator` | `^0.14.3`              | `^0.15.1`      | Core, item, logger, validation, JWT auth hook, rate limiter hook |

Install the peers required by the packages you use. For an application embedding
the core module with Fastify:

```bash
npm install @nestjs/common@^11 @nestjs/core@^11 \
  @nestjs/platform-fastify@^11 @nestjs/swagger@^11 \
  fastify@^5.12.3 class-validator@^0.15.1
npm ls @nestjs/common @nestjs/core @nestjs/swagger fastify class-validator
```

Resolve incompatible peer versions in your application. Fastify is now required
by the core package even if you previously installed core without a direct
Fastify dependency. Applications already on NestJS 11 still need to check the
Fastify and class-validator ranges.

### 3. Check runtime and test compatibility

Use Node.js 24 for your application, matching the supported runtime. The v4 Docker
image uses Node.js 24.21.0. Node 24 was already the documented runtime; this update
does not introduce a new Node major requirement.

Updated NestJS Axios/event-emitter integrations and JWKS dependencies include ESM
modules. If your application's CommonJS Jest tests fail on ESM syntax after the
upgrade, allow Jest to transform `@nestjs/axios`, `@nestjs/event-emitter`, and
`jose`. Merge these into your existing exceptions rather than replacing them,
and ensure your transformer handles JavaScript as well as TypeScript. For example,
with `ts-jest` and a test tsconfig configured to compile JavaScript:

```javascript
transform: {
  '^.+\\.[tj]s$': ['ts-jest', { tsconfig: './tsconfig.spec.json' }],
},
transformIgnorePatterns: [
  'node_modules/(?!(@nestjs/axios|@nestjs/event-emitter|jose)/)',
],
```

### 4. Review custom rate-limiter and Prisma CLI usage

These changes only require action if you use the affected services directly:

- `RateLimiterService.consume()` now returns `{ allowed: true }` when the limiter
  is disabled. If you previously called it directly with `enabled: false` and
  expected enforcement, set `enabled: true` and supply `points` and `duration`.
  Normal hook configuration continues to work; duration units remain seconds.
- `dismissible-prisma` now uses the Prisma CLI installed with the PostgreSQL
  adapter instead of invoking `npx prisma`. If your setup relied on a different
  CLI being selected or downloaded at runtime, use the bundled CLI through
  `npx dismissible-prisma`. Existing wrapper commands continue to work. An explicit
  `--config` is now honored instead of the wrapper appending its own config.

No changes to Dismissible imports, module registration, configuration fields, or
stored data are required by the reviewed update. Internal dependency upgrades are
installed with the packages; you do not need to install them individually.

After upgrading, build and test your application, including authentication,
validation, caching, and rate limiting where used. Verify reads of existing items
and create/dismiss/restore before completing the rollout.
