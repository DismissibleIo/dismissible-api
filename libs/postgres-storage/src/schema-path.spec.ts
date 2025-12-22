import { getPrismaSchemaPath } from './schema-path';
import { join } from 'path';

describe('schema-path', () => {
  describe('getPrismaSchemaPath', () => {
    it('should return the absolute path to the Prisma schema file', () => {
      const schemaPath = getPrismaSchemaPath();

      expect(schemaPath).toBeDefined();
      expect(typeof schemaPath).toBe('string');
      expect(schemaPath).toContain('prisma');
      expect(schemaPath).toContain('schema.prisma');
      expect(schemaPath).toBe(join(__dirname, '..', 'prisma', 'schema.prisma'));
    });

    it('should return a valid path structure', () => {
      const schemaPath = getPrismaSchemaPath();

      expect(schemaPath).toMatch(/^(\/|[A-Z]:\\)/);
    });
  });
});
