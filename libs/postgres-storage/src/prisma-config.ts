import { join } from 'path';
import { getPrismaSchemaPath } from './schema-path';

/**
 * Creates a Prisma configuration object with paths resolved relative to
 * the @dismissible/nestjs-postgres-storage package.
 *
 * @returns Prisma configuration object suitable for use with defineConfig()
 *
 * @example
 * ```typescript
 * // prisma.config.mjs
 * import { defineConfig } from 'prisma/config';
 * import { basePrismaConfig } from '@dismissible/nestjs-postgres-storage';
 *
 * export default defineConfig(basePrismaConfig);
 * ```
 */
export function createPrismaConfig() {
  const prismaDir = join(getPrismaSchemaPath(), '..');
  return {
    schema: join(prismaDir, 'schema.prisma'),
    migrations: {
      path: join(prismaDir, 'migrations'),
    },
    datasource: {
      url:
        process.env.DATABASE_URL ??
        process.env.DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING ??
        '',
    },
  };
}

/**
 * Base Prisma configuration for @dismissible/nestjs-postgres-storage.
 *
 * Use this with Prisma's defineConfig() to create your prisma.config.mjs:
 *
 * @example
 * ```javascript
 * // prisma.config.mjs
 * import { defineConfig } from 'prisma/config';
 * import { basePrismaConfig } from '@dismissible/nestjs-postgres-storage';
 *
 * export default defineConfig(basePrismaConfig);
 * ```
 *
 * @example Extending the config
 * ```javascript
 * import { defineConfig } from 'prisma/config';
 * import { basePrismaConfig } from '@dismissible/nestjs-postgres-storage';
 *
 * export default defineConfig({
 *   ...basePrismaConfig,
 *   migrations: {
 *     ...basePrismaConfig.migrations,
 *     seed: 'tsx prisma/seed.ts',
 *   },
 * });
 * ```
 */
export const basePrismaConfig = createPrismaConfig();
