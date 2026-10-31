import { join } from 'path';
import { IsDefined, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NullLogger } from '@dismissible/nestjs-logger';
import { DISMISSIBLE_STORAGE_ADAPTER, MemoryStorageAdapter } from '@dismissible/nestjs-storage';
import { DISMISSIBLE_CACHE_ADAPTER } from '@dismissible/nestjs-cache';
import { MemoryCacheAdapter } from '@dismissible/nestjs-memory-cache';
import { AppConfig } from '../../src/config/app.config';
import {
  DismissibleNestFactory,
  IDismissibleNestApplication,
} from '../../src/dismissible-nest-factory';
import { StorageType } from '../../src/storage/storage.config';

const switchConfigPath = join(__dirname, '../config/backend-switch');
const validationConfigPath = join(__dirname, '../config/backend-validation');

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

describe('DismissibleNestFactory', () => {
  const originalEnv = process.env;
  let app: IDismissibleNestApplication | undefined;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.DISMISSIBLE_STORAGE_TYPE;
    process.env.DISMISSIBLE_CACHE_TYPE = 'memory';
  });

  afterEach(async () => {
    await app?.getNestApplication().close();
    app = undefined;
    process.env = originalEnv;
  });

  it('should select storage from the option over the config file', async () => {
    app = await DismissibleNestFactory.create({
      configPath: switchConfigPath,
      schema: CustomAppConfig,
      logger: NullLogger,
      storage: StorageType.MEMORY,
    });

    expect(app.getNestApplication().get(DISMISSIBLE_STORAGE_ADAPTER)).toBeInstanceOf(
      MemoryStorageAdapter,
    );
  });

  it('should select the backends named by the environment variables', async () => {
    process.env.DISMISSIBLE_STORAGE_TYPE = 'memory';

    app = await DismissibleNestFactory.create({
      configPath: switchConfigPath,
      schema: CustomAppConfig,
      logger: NullLogger,
    });

    const nestApp = app.getNestApplication();
    expect(nestApp.get(DISMISSIBLE_STORAGE_ADAPTER)).toBeInstanceOf(MemoryStorageAdapter);
    expect(nestApp.get(DISMISSIBLE_CACHE_ADAPTER)).toBeInstanceOf(MemoryCacheAdapter);
  });

  it('should expose custom schema fields', async () => {
    app = await DismissibleNestFactory.create({
      configPath: switchConfigPath,
      schema: CustomAppConfig,
      logger: NullLogger,
      storage: StorageType.MEMORY,
    });

    expect(app.getNestApplication().get(CustomAppConfig).customFeature.featureName).toBe(
      'switch-feature',
    );
  });

  it('should serve requests on the configured port once started', async () => {
    app = await DismissibleNestFactory.create({
      configPath: switchConfigPath,
      schema: CustomAppConfig,
      logger: NullLogger,
      storage: StorageType.MEMORY,
    });

    await app.start();

    const response = await fetch('http://localhost:3097/v1/users/factory-user/items/factory-item');
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { itemId: string } };
    expect(body.data.itemId).toBe('factory-item');
  });

  it('should reject invalid settings of the selected backend', async () => {
    process.env.DISMISSIBLE_STORAGE_TYPE = 'postgres';

    await expect(
      DismissibleNestFactory.create({ configPath: validationConfigPath, logger: NullLogger }),
    ).rejects.toThrow(/postgres/);
  });
});
