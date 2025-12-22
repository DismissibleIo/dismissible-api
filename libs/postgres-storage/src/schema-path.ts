import { join } from 'path';

/**
 * Returns the absolute path to the Prisma schema file.
 * Useful for consumers who need to run prisma commands programmatically.
 *
 * @example
 * ```typescript
 * import { getPrismaSchemaPath } from '@dismissible/nestjs-postgres-storage';
 * import { execSync } from 'child_process';
 *
 * execSync(`npx prisma generate --schema=${getPrismaSchemaPath()}`);
 * ```
 */
export function getPrismaSchemaPath(): string {
  return join(__dirname, '..', 'prisma', 'schema.prisma');
}
