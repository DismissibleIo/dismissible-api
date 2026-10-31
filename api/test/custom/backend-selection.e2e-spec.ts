import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { join } from 'path';
import { IsDefined, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NullLogger } from '@dismissible/nestjs-logger';
import { DISMISSIBLE_STORAGE_ADAPTER, MemoryStorageAdapter } from '@dismissible/nestjs-storage';
import { DISMISSIBLE_CACHE_ADAPTER } from '@dismissible/nestjs-cache';
import {
  DISMISSIBLE_MEMORY_CACHE_CONFIG,
  MemoryCacheAdapter,
} from '@dismissible/nestjs-memory-cache';
import { DynamoDBStorageAdapter } from '@dismissible/nestjs-dynamodb-storage';
import { AppModuleOptions } from '../../src/app.module';
import { createTestApp } from '../../src/app-test.factory';
import { AppConfig } from '../../src/config/app.config';
import { CacheConfig, CacheType } from '../../src/cache/cache.config';
import { StorageConfig, StorageType } from '../../src/storage/storage.config';

const switchConfigPath = join(__dirname, '../config/backend-switch');
const validationConfigPath = join(__dirname, '../config/backend-validation');
const missingSectionsConfigPath = join(__dirname, '../config/backend-missing-sections');

class CustomFeatureConfig {
  @IsDefined()
  @IsString()
  public readonly featureName!: string;
}

class CustomAppConfig extends AppConfig {
  @ValidateNested()
  @IsDefined()
  @Type(() => CustomFeatureConfig)
  public readonly customFeature!: CustomFeatureConfig;
}

describe('Backend selection', () => {
  const originalEnv = process.env;
  let app: INestApplication | undefined;

  const createApp = async (moduleOptions: AppModuleOptions) => {
    app = await createTestApp({ moduleOptions: { logger: NullLogger, ...moduleOptions } });
    return app;
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.DISMISSIBLE_STORAGE_TYPE;
    delete process.env.DISMISSIBLE_CACHE_TYPE;
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
    process.env = originalEnv;
  });

  describe('storage', () => {
    it('should prefer the storage option over the backend in the config file', async () => {
      const testApp = await createApp({
        configPath: switchConfigPath,
        schema: CustomAppConfig,
        storage: StorageType.MEMORY,
        cache: CacheType.MEMORY,
      });

      expect(testApp.get(DISMISSIBLE_STORAGE_ADAPTER)).toBeInstanceOf(MemoryStorageAdapter);
      const response = await request(testApp.getHttpServer())
        .get('/v1/users/switch-user/items/switch-item')
        .expect(200);
      expect(response.body.data.itemId).toBe('switch-item');
    });

    it('should prefer the storage option over the environment variable', async () => {
      process.env.DISMISSIBLE_STORAGE_TYPE = 'postgres';

      const testApp = await createApp({
        configPath: switchConfigPath,
        schema: CustomAppConfig,
        storage: StorageType.DYNAMODB,
        cache: CacheType.MEMORY,
      });

      expect(testApp.get(DISMISSIBLE_STORAGE_ADAPTER)).toBeInstanceOf(DynamoDBStorageAdapter);
    });

    it('should keep the unselected backend settings when the storage option switches backend', async () => {
      const testApp = await createApp({
        configPath: switchConfigPath,
        schema: CustomAppConfig,
        storage: StorageType.MEMORY,
        cache: CacheType.MEMORY,
      });

      expect(testApp.get(StorageConfig).postgres.connectionString).toBe(
        'postgresql://switch-user:switch-pass@localhost:5432/switch-db',
      );
      expect(testApp.get(CustomAppConfig).storage).toBe(testApp.get(StorageConfig));
    });

    it('should use the same backend for the adapter and config when selected by environment variable', async () => {
      process.env.DISMISSIBLE_STORAGE_TYPE = 'memory';
      process.env.DISMISSIBLE_CACHE_TYPE = 'memory';

      const testApp = await createApp({ configPath: switchConfigPath, schema: CustomAppConfig });

      expect(testApp.get(DISMISSIBLE_STORAGE_ADAPTER)).toBeInstanceOf(MemoryStorageAdapter);
      expect(testApp.get(StorageConfig).type).toBe('memory');
      expect(testApp.get(CustomAppConfig).storage.type).toBe('memory');
    });
  });

  describe('cache', () => {
    it('should prefer the cache option over the backend in the config file', async () => {
      const testApp = await createApp({
        configPath: switchConfigPath,
        schema: CustomAppConfig,
        storage: StorageType.MEMORY,
        cache: CacheType.MEMORY,
      });

      expect(testApp.get(DISMISSIBLE_CACHE_ADAPTER)).toBeInstanceOf(MemoryCacheAdapter);
    });

    it('should prefer the cache option over the environment variable', async () => {
      process.env.DISMISSIBLE_CACHE_TYPE = 'redis';

      const testApp = await createApp({
        configPath: switchConfigPath,
        schema: CustomAppConfig,
        storage: StorageType.MEMORY,
        cache: CacheType.MEMORY,
      });

      expect(testApp.get(DISMISSIBLE_CACHE_ADAPTER)).toBeInstanceOf(MemoryCacheAdapter);
    });

    it('should keep nested settings when the cache option switches redis to memory', async () => {
      const testApp = await createApp({
        configPath: switchConfigPath,
        schema: CustomAppConfig,
        storage: StorageType.MEMORY,
        cache: CacheType.MEMORY,
      });

      expect(testApp.get(DISMISSIBLE_MEMORY_CACHE_CONFIG)).toMatchObject({
        maxItems: 42,
        ttlMs: 4200,
      });
      expect(testApp.get(CacheConfig).redis).toMatchObject({
        url: 'redis://switch-host:6379',
        keyPrefix: 'switch:',
      });
      expect(testApp.get(CustomAppConfig).cache).toBe(testApp.get(CacheConfig));
    });

    it('should use the same backend for the adapter and config when selected by environment variable', async () => {
      process.env.DISMISSIBLE_STORAGE_TYPE = 'memory';
      process.env.DISMISSIBLE_CACHE_TYPE = 'memory';

      const testApp = await createApp({ configPath: switchConfigPath, schema: CustomAppConfig });

      expect(testApp.get(DISMISSIBLE_CACHE_ADAPTER)).toBeInstanceOf(MemoryCacheAdapter);
      expect(testApp.get(CacheConfig).type).toBe('memory');
      expect(testApp.get(CustomAppConfig).cache?.type).toBe('memory');
    });
  });

  describe('custom schema', () => {
    it('should keep custom schema fields when options switch both backends', async () => {
      const testApp = await createApp({
        configPath: switchConfigPath,
        schema: CustomAppConfig,
        storage: StorageType.MEMORY,
        cache: CacheType.MEMORY,
      });

      expect(testApp.get(CustomAppConfig).customFeature.featureName).toBe('switch-feature');
      expect(testApp.get(CustomFeatureConfig).featureName).toBe('switch-feature');
    });
  });

  describe('validation', () => {
    it('should ignore invalid settings of unselected backends', async () => {
      process.env.DISMISSIBLE_CACHE_TYPE = 'memory';

      const testApp = await createApp({ configPath: validationConfigPath });

      expect(testApp.get(DISMISSIBLE_STORAGE_ADAPTER)).toBeInstanceOf(MemoryStorageAdapter);
      expect(testApp.get(DISMISSIBLE_CACHE_ADAPTER)).toBeInstanceOf(MemoryCacheAdapter);
    });

    it('should boot the memory cache with its defaults when it has no settings', async () => {
      process.env.DISMISSIBLE_CACHE_TYPE = 'memory';

      const testApp = await createApp({ configPath: missingSectionsConfigPath });

      expect(testApp.get(DISMISSIBLE_CACHE_ADAPTER)).toBeInstanceOf(MemoryCacheAdapter);
      const response = await request(testApp.getHttpServer())
        .get('/v1/users/defaults-user/items/defaults-item')
        .expect(200);
      expect(response.body.data.itemId).toBe('defaults-item');
    });

    it('should reject the redis cache when it has no settings', async () => {
      process.env.DISMISSIBLE_CACHE_TYPE = 'redis';

      await expect(createApp({ configPath: missingSectionsConfigPath })).rejects.toThrow(
        /Configuration is not valid[\s\S]*cache\.redis/,
      );
    });

    it.each([
      ['postgres', 'DISMISSIBLE_STORAGE_TYPE', 'postgres'],
      ['dynamodb', 'DISMISSIBLE_STORAGE_TYPE', 'dynamodb'],
      ['redis', 'DISMISSIBLE_CACHE_TYPE', 'redis'],
    ])('should reject invalid settings of the selected %s backend', async (_, variable, value) => {
      process.env[variable] = value;

      await expect(createApp({ configPath: validationConfigPath })).rejects.toThrow(
        new RegExp(value),
      );
    });
  });
});
