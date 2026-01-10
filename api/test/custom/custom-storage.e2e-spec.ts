import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { join } from 'path';
import { createTestApp, cleanupTestData } from '../../src/app-test.factory';
import { NullLogger } from '@dismissible/nestjs-logger';
import { StorageType } from '../../src/storage/storage.config';

describe('AppModule with explicit storage option', () => {
  describe('memory storage via StorageType enum', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/default'),
          logger: NullLogger,
          storage: StorageType.MEMORY,
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

    it('should create items with explicit memory storage', async () => {
      const userId = 'storage-test-user-1';
      const itemId = 'storage-test-item-1';

      const response = await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.itemId).toBe(itemId);
      expect(response.body.data.userId).toBe(userId);
    });

    it('should persist data within the same test run', async () => {
      const userId = 'storage-persist-user';
      const itemId = 'storage-persist-item';

      // Create an item
      const createResponse = await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .expect(200);

      const createdAt = createResponse.body.data.createdAt;

      // Retrieve the same item - should return cached version
      const retrieveResponse = await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .expect(200);

      expect(retrieveResponse.body.data.createdAt).toBe(createdAt);
    });

    it('should handle full CRUD cycle with explicit storage', async () => {
      const userId = 'storage-crud-user';
      const itemId = 'storage-crud-item';

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

  describe('memory storage via string literal', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/default'),
          logger: NullLogger,
          storage: 'memory' as StorageType,
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

    it('should work with string literal storage type', async () => {
      const userId = 'string-storage-user';
      const itemId = 'string-storage-item';

      const response = await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .expect(200);

      expect(response.body.data.itemId).toBe(itemId);
    });
  });

  describe('storage isolation between test suites', () => {
    let app1: INestApplication;
    let app2: INestApplication;

    beforeAll(async () => {
      // Create two separate app instances
      app1 = await createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/default'),
          logger: NullLogger,
          storage: StorageType.MEMORY,
        },
      });

      app2 = await createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/default'),
          logger: NullLogger,
          storage: StorageType.MEMORY,
        },
      });

      await cleanupTestData(app1);
      await cleanupTestData(app2);
    });

    afterAll(async () => {
      if (app1) {
        await cleanupTestData(app1);
        await app1.close();
      }
      if (app2) {
        await cleanupTestData(app2);
        await app2.close();
      }
    });

    it('should have isolated storage between app instances', async () => {
      const userId = 'isolated-user';
      const itemId = 'isolated-item';

      // Create item in app1
      await request(app1.getHttpServer()).get(`/v1/users/${userId}/items/${itemId}`).expect(200);

      // Dismiss in app1
      const dismissResponse = await request(app1.getHttpServer())
        .delete(`/v1/users/${userId}/items/${itemId}`)
        .expect(200);

      expect(dismissResponse.body.data.dismissedAt).toBeDefined();

      // Create same item in app2 - should be a new item (not dismissed)
      const app2Response = await request(app2.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .expect(200);

      // In app2, the item should NOT be dismissed (different storage instance)
      expect(app2Response.body.data.dismissedAt).toBeUndefined();
    });
  });
});
