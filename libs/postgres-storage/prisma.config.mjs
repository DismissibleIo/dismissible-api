import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { defineConfig } from 'prisma/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prismaDir = join(__dirname, 'prisma');

/**
 * Prisma configuration for @dismissible/nestjs-postgres-storage.
 *
 * This config is used by the dismissible-prisma CLI and can be used directly
 * by consumers who need to extend or customize the configuration.
 *
 * For consumers who want to use the base config in their own prisma.config.mjs:
 *
 * @example
 * ```javascript
 * import { defineConfig } from 'prisma/config';
 * import { basePrismaConfig } from '@dismissible/nestjs-postgres-storage';
 *
 * export default defineConfig(basePrismaConfig);
 * ```
 */
export default defineConfig({
  schema: join(prismaDir, 'schema.prisma'),
  migrations: {
    path: join(prismaDir, 'migrations'),
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      process.env.DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING ??
      'postgresql://postgres:postgres@localhost:5432/dismissible',
  },
});
