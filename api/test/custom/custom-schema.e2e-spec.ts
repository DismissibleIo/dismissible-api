import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { join } from 'path';
import { createTestApp, cleanupTestData } from '../../src/app-test.factory';
import { NullLogger } from '@dismissible/nestjs-logger';
import { AppConfig } from '../../src/config/app.config';
import { ValidateNested, IsBoolean, IsNumber, IsString, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Custom feature configuration for testing schema extension.
 */
class CustomFeatureConfig {
  @IsDefined()
  @IsBoolean()
  public readonly enabled!: boolean;

  @IsDefined()
  @IsNumber()
  public readonly maxItems!: number;

  @IsDefined()
  @IsString()
  public readonly featureName!: string;
}

/**
 * Custom app config that extends AppConfig with additional properties.
 */
class CustomAppConfig extends AppConfig {
  @ValidateNested()
  @IsDefined()
  @Type(() => CustomFeatureConfig)
  public readonly customFeature!: CustomFeatureConfig;
}

describe('AppModule with custom schema option', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp({
      moduleOptions: {
        configPath: join(__dirname, '../config/custom-schema'),
        logger: NullLogger,
        schema: CustomAppConfig,
      },
    });
    await cleanupTestData(app);
  });

  afterAll(async () => {
    if (app) {
      await cleanupTestData(app);
      await app.close();
    }
  });

  it('should boot successfully with custom schema', async () => {
    expect(app).toBeDefined();
  });

  it('should load custom config properties', () => {
    const config = app.get(CustomAppConfig);

    expect(config).toBeDefined();
    expect(config.customFeature).toBeDefined();
    expect(config.customFeature.enabled).toBe(true);
    expect(config.customFeature.maxItems).toBe(100);
    expect(config.customFeature.featureName).toBe('test-feature');
  });

  it('should still load base DefaultAppConfig properties', () => {
    const config = app.get(CustomAppConfig);

    expect(config.server).toBeDefined();
    expect(config.server.port).toBe(3002);
    expect(config.cors).toBeDefined();
    expect(config.helmet).toBeDefined();
    expect(config.validation).toBeDefined();
  });

  it('should handle dismissible operations with custom schema', async () => {
    const userId = 'schema-test-user';
    const itemId = 'schema-test-item';

    const response = await request(app.getHttpServer())
      .get(`/v1/users/${userId}/items/${itemId}`)
      .expect(200);

    expect(response.body.data).toBeDefined();
    expect(response.body.data.itemId).toBe(itemId);
    expect(response.body.data.userId).toBe(userId);
  });

  it('should handle full CRUD cycle with custom schema', async () => {
    const userId = 'schema-crud-user';
    const itemId = 'schema-crud-item';

    // Create
    const createResponse = await request(app.getHttpServer())
      .get(`/v1/users/${userId}/items/${itemId}`)
      .expect(200);

    expect(createResponse.body.data.dismissedAt).toBeUndefined();

    // Dismiss
    const dismissResponse = await request(app.getHttpServer())
      .delete(`/v1/users/${userId}/items/${itemId}`)
      .expect(200);

    expect(dismissResponse.body.data.dismissedAt).toBeDefined();

    // Restore
    const restoreResponse = await request(app.getHttpServer())
      .post(`/v1/users/${userId}/items/${itemId}`)
      .expect(201);

    expect(restoreResponse.body.data.dismissedAt).toBeUndefined();
  });
});

/**
 * Schema with no additions, for testing an explicitly provided schema.
 */
class ExplicitAppConfig extends AppConfig {}

describe('AppModule schema validation', () => {
  it('should fail to boot with invalid schema config', async () => {
    // Define a schema with required properties that won't be in the config
    class StrictRequiredConfig extends ExplicitAppConfig {
      @IsDefined()
      @IsString()
      public readonly requiredMissingProperty!: string;
    }

    await expect(
      createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/default'),
          logger: NullLogger,
          schema: StrictRequiredConfig,
        },
      }),
    ).rejects.toThrow();
  });
});

describe('AppModule with different config paths', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp({
      moduleOptions: {
        configPath: join(__dirname, '../config/default'),
        logger: NullLogger,
        // Explicitly using ExplicitAppConfig schema
        schema: ExplicitAppConfig,
      },
    });
    await cleanupTestData(app);
  });

  afterAll(async () => {
    if (app) {
      await cleanupTestData(app);
      await app.close();
    }
  });

  it('should use explicitly provided schema', () => {
    const config = app.get(ExplicitAppConfig);

    expect(config).toBeDefined();
    expect(config.server.port).toBe(3001);
  });

  it('should handle dismissible operations with explicit default schema', async () => {
    const userId = 'default-schema-user';
    const itemId = 'default-schema-item';

    const response = await request(app.getHttpServer())
      .get(`/v1/users/${userId}/items/${itemId}`)
      .expect(200);

    expect(response.body.data.itemId).toBe(itemId);
  });
});
