import { join } from 'path';

describe('prisma-config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.DATABASE_URL;
    delete process.env.DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('createPrismaConfig', () => {
    it('should return config with schema path relative to package', async () => {
      const { createPrismaConfig } = await import('./prisma-config');
      const config = createPrismaConfig();

      expect(config.schema).toContain('schema.prisma');
      expect(config.schema).toMatch(/postgres-storage.*prisma.*schema\.prisma$/);
    });

    it('should return config with migrations path relative to package', async () => {
      const { createPrismaConfig } = await import('./prisma-config');
      const config = createPrismaConfig();

      expect(config.migrations.path).toContain('migrations');
      expect(config.migrations.path).toMatch(/postgres-storage.*prisma.*migrations$/);
    });

    it('should use DATABASE_URL when set', async () => {
      process.env.DATABASE_URL = 'postgres://test:test@localhost/test';

      const { createPrismaConfig } = await import('./prisma-config');
      const config = createPrismaConfig();

      expect(config.datasource.url).toBe('postgres://test:test@localhost/test');
    });

    it('should fall back to DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING when DATABASE_URL is not set', async () => {
      process.env.DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING =
        'postgres://fallback:fallback@localhost/fallback';

      const { createPrismaConfig } = await import('./prisma-config');
      const config = createPrismaConfig();

      expect(config.datasource.url).toBe('postgres://fallback:fallback@localhost/fallback');
    });

    it('should prefer DATABASE_URL over DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING', async () => {
      process.env.DATABASE_URL = 'postgres://primary:primary@localhost/primary';
      process.env.DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING =
        'postgres://fallback:fallback@localhost/fallback';

      const { createPrismaConfig } = await import('./prisma-config');
      const config = createPrismaConfig();

      expect(config.datasource.url).toBe('postgres://primary:primary@localhost/primary');
    });

    it('should return empty string when no database URL is set', async () => {
      const { createPrismaConfig } = await import('./prisma-config');
      const config = createPrismaConfig();

      expect(config.datasource.url).toBe('');
    });
  });

  describe('basePrismaConfig', () => {
    it('should be exported and have the expected structure', async () => {
      const { basePrismaConfig } = await import('./prisma-config');

      expect(basePrismaConfig).toBeDefined();
      expect(basePrismaConfig).toHaveProperty('schema');
      expect(basePrismaConfig).toHaveProperty('migrations');
      expect(basePrismaConfig).toHaveProperty('datasource');
      expect(basePrismaConfig.migrations).toHaveProperty('path');
      expect(basePrismaConfig.datasource).toHaveProperty('url');
    });

    it('should have schema and migrations paths pointing to the same prisma directory', async () => {
      const { basePrismaConfig } = await import('./prisma-config');

      const schemaDir = join(basePrismaConfig.schema, '..');
      const migrationsDir = join(basePrismaConfig.migrations.path, '..');

      expect(schemaDir).toBe(migrationsDir);
    });
  });
});
