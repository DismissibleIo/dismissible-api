import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { join } from 'path';
import { createTestApp, cleanupTestData } from '../src/app-test.factory';
import { NullLogger } from '@dismissible/nestjs-logger';

describe('Swagger E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp({
      moduleOptions: {
        configPath: join(__dirname, 'config-swagger'),
        logger: NullLogger,
      },
    });
    await cleanupTestData(app);
  });

  afterAll(async () => {
    await cleanupTestData(app);
    await app.close();
  });

  describe('Swagger documentation endpoint', () => {
    it('should return swagger JSON at /docs-json when swagger is enabled', async () => {
      const response = await request(app.getHttpServer()).get('/docs-json').expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.openapi).toBeDefined();
      expect(response.body.openapi).toMatch(/^3\.\d+\.\d+$/); // OpenAPI 3.x.x
      expect(response.body.info).toBeDefined();
      expect(response.body.info.title).toBe('Dismissible');
      expect(response.body.info.description).toBe('An API to handle dismissible items for users');
      expect(response.body.info.version).toBe('1.0');
    });

    it('should return swagger UI HTML at /docs when swagger is enabled', async () => {
      const response = await request(app.getHttpServer()).get('/docs').expect(200);

      expect(response.text).toBeDefined();
      expect(response.text).toContain('<!DOCTYPE html>');
      expect(response.text).toContain('swagger-ui');
      // Verify the swagger UI container is present
      expect(response.text).toContain('swagger-ui');
      // Verify the swagger UI initialization script is present
      expect(response.text).toContain('swagger-ui-init.js');
    });

    it('should return a valid OpenAPI document structure', async () => {
      const response = await request(app.getHttpServer()).get('/docs-json').expect(200);

      // Verify the document has the expected structure
      expect(response.body).toHaveProperty('openapi');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('paths');
      expect(response.body).toHaveProperty('servers');
    });

    it('should include servers array in the OpenAPI document', async () => {
      const response = await request(app.getHttpServer()).get('/docs-json').expect(200);

      expect(response.body.servers).toBeDefined();
      expect(Array.isArray(response.body.servers)).toBe(true);
    });
  });
});
