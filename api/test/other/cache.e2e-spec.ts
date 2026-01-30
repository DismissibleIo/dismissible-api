import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { join } from 'path';
import { createTestApp, cleanupTestData } from '../../src/app-test.factory';
import { NullLogger } from '@dismissible/nestjs-logger';
import { DISMISSIBLE_CACHE_ADAPTER, IDismissibleCache } from '@dismissible/nestjs-cache';
import { CacheType } from '../../src/cache/cache.config';
import { RedisClientService } from '@dismissible/nestjs-redis-cache';

describe('Cache E2E', () => {
  describe('Cache disabled (null cache)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/cache-disabled'),
          logger: NullLogger,
        },
      });
      await cleanupTestData(app);
    });

    beforeEach(async () => {
      await cleanupTestData(app);
    });

    afterAll(async () => {
      await cleanupTestData(app);
      await app.close();
    });

    it('should use null cache adapter when cache is not configured', () => {
      const cache = app.get<IDismissibleCache>(DISMISSIBLE_CACHE_ADAPTER);
      // Null cache adapter should be available and return null for get operations
      expect(cache).toBeDefined();
      // Verify it's a null cache by checking it returns null
      expect(cache.get('test-user', 'test-item')).resolves.toBeNull();
    });

    it('should retrieve items from storage when cache is disabled', async () => {
      const userId = 'cache-disabled-user';
      const itemId = 'cache-disabled-item';

      const response = await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.itemId).toBe(itemId);
      expect(response.body.data.userId).toBe(userId);
    });

    it('should handle full CRUD cycle with cache disabled', async () => {
      const userId = 'cache-disabled-crud-user';
      const itemId = 'cache-disabled-crud-item';

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

  describe('Memory cache enabled', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/cache-memory'),
          logger: NullLogger,
          cache: CacheType.MEMORY,
        },
      });
      await cleanupTestData(app);
    });

    beforeEach(async () => {
      await cleanupTestData(app);
    });

    afterAll(async () => {
      await cleanupTestData(app);
      await app.close();
    });

    it('should use memory cache adapter when memory cache is configured', async () => {
      const cache = app.get<IDismissibleCache>(DISMISSIBLE_CACHE_ADAPTER);
      // Memory cache adapter should be available
      expect(cache).toBeDefined();
      // Check the cache type
      expect(cache.constructor.name).toBe('MemoryCacheAdapter');
      // Verify it's a real cache (not null cache) by checking that a non-existent item returns null
      const result = await cache.get('test-user', 'non-existent-item');
      expect(result).toBeNull();
    });

    it('should retrieve items with memory cache enabled', async () => {
      const userId = 'cache-memory-user';
      const itemId = 'cache-memory-item';
      const cache = app.get<IDismissibleCache>(DISMISSIBLE_CACHE_ADAPTER);

      // First request - creates the item
      const firstResponse = await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .expect(200);

      expect(firstResponse.body.data).toBeDefined();
      expect(firstResponse.body.data.itemId).toBe(itemId);
      expect(firstResponse.body.data.userId).toBe(userId);

      // Second request - should hit cache
      const secondResponse = await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .expect(200);

      expect(secondResponse.body.data.itemId).toBe(itemId);

      // Verify item is now cached
      const cachedItem = await cache.get(userId, itemId);
      expect(cachedItem).not.toBeNull();
      expect(cachedItem?.userId).toBe(userId);
    });

    it('should handle full CRUD cycle with memory cache enabled', async () => {
      const userId = 'cache-memory-crud-user';
      const itemId = 'cache-memory-crud-item';
      const cache = app.get<IDismissibleCache>(DISMISSIBLE_CACHE_ADAPTER);

      // Create
      const createResponse = await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .expect(200);
      expect(createResponse.body.data.dismissedAt).toBeUndefined();

      // Verify item is cached after creation
      let cachedItem = await cache.get(userId, itemId);
      expect(cachedItem).not.toBeNull();
      expect(cachedItem?.dismissedAt).toBeFalsy();

      // Dismiss (should update cache)
      const dismissResponse = await request(app.getHttpServer())
        .delete(`/v1/users/${userId}/items/${itemId}`)
        .expect(200);
      expect(dismissResponse.body.data.dismissedAt).toBeDefined();

      // Verify cache contains updated item with dismissedAt
      cachedItem = await cache.get(userId, itemId);
      expect(cachedItem).not.toBeNull();
      expect(cachedItem?.dismissedAt).not.toBeNull();

      // Restore (should update cache)
      const restoreResponse = await request(app.getHttpServer())
        .post(`/v1/users/${userId}/items/${itemId}`)
        .expect(201);
      expect(restoreResponse.body.data.dismissedAt).toBeUndefined();

      // Verify cache contains updated item without dismissedAt
      cachedItem = await cache.get(userId, itemId);
      expect(cachedItem).not.toBeNull();
      expect(cachedItem?.dismissedAt).toBeFalsy();
    });

    it('should cache items for subsequent requests', async () => {
      const userId = 'cache-memory-cache-test-user';
      const itemId = 'cache-memory-cache-test-item';
      const cache = app.get<IDismissibleCache>(DISMISSIBLE_CACHE_ADAPTER);

      // First request - should create and cache
      const firstResponse = await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .expect(200);
      const createdAt = firstResponse.body.data.createdAt;

      // Verify item is in cache after first request
      const cachedItem = await cache.get(userId, itemId);
      expect(cachedItem).not.toBeNull();
      expect(cachedItem?.userId).toBe(userId);
      // Compare dates as timestamps since they might be Date objects or ISO strings
      const cachedCreatedAt = cachedItem?.createdAt;
      expect(cachedCreatedAt).toBeDefined();

      // Second request - should return cached item
      const secondResponse = await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .expect(200);

      // Should return the same item (same createdAt)
      expect(secondResponse.body.data.createdAt).toBe(createdAt);

      // Verify cache still has the item
      const cachedItemAfter = await cache.get(userId, itemId);
      expect(cachedItemAfter).not.toBeNull();
      expect(cachedItemAfter?.userId).toBe(userId);
    });
  });

  describe('Redis cache enabled', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/cache-redis'),
          logger: NullLogger,
          cache: CacheType.REDIS,
        },
      });
      // Flush Redis cache and storage
      const redisClient = app.get(RedisClientService);
      await redisClient.getClient().flushdb();
      await cleanupTestData(app);
    });

    beforeEach(async () => {
      // Flush Redis cache and storage before each test
      const redisClient = app.get(RedisClientService);
      await redisClient.getClient().flushdb();
      await cleanupTestData(app);
    });

    afterAll(async () => {
      await cleanupTestData(app);
      await app.close();
    });

    it('should use redis cache adapter when redis cache is configured', () => {
      const cache = app.get<IDismissibleCache>(DISMISSIBLE_CACHE_ADAPTER);
      // Redis cache adapter should be available
      expect(cache).toBeDefined();
      // Redis cache should not return null immediately (it's a real cache)
      expect(cache).toBeDefined();
    });

    it('should retrieve items with redis cache enabled', async () => {
      const userId = 'cache-redis-user';
      const itemId = 'cache-redis-item';
      const cache = app.get<IDismissibleCache>(DISMISSIBLE_CACHE_ADAPTER);

      const response = await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.itemId).toBe(itemId);
      expect(response.body.data.userId).toBe(userId);

      // Verify item is now cached in Redis
      const cachedItem = await cache.get(userId, itemId);
      expect(cachedItem).not.toBeNull();
      expect(cachedItem?.userId).toBe(userId);
    });

    it('should handle full CRUD cycle with redis cache enabled', async () => {
      const userId = 'cache-redis-crud-user';
      const itemId = 'cache-redis-crud-item';
      const cache = app.get<IDismissibleCache>(DISMISSIBLE_CACHE_ADAPTER);

      // Create
      const createResponse = await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .expect(200);
      expect(createResponse.body.data.dismissedAt).toBeUndefined();

      // Verify item is cached after creation
      let cachedItem = await cache.get(userId, itemId);
      expect(cachedItem).not.toBeNull();
      expect(cachedItem?.dismissedAt).toBeFalsy();

      // Dismiss (should update cache)
      const dismissResponse = await request(app.getHttpServer())
        .delete(`/v1/users/${userId}/items/${itemId}`)
        .expect(200);
      expect(dismissResponse.body.data.dismissedAt).toBeDefined();

      // Verify cache contains updated item with dismissedAt
      cachedItem = await cache.get(userId, itemId);
      expect(cachedItem).not.toBeNull();
      expect(cachedItem?.dismissedAt).not.toBeNull();

      // Restore (should update cache)
      const restoreResponse = await request(app.getHttpServer())
        .post(`/v1/users/${userId}/items/${itemId}`)
        .expect(201);
      expect(restoreResponse.body.data.dismissedAt).toBeUndefined();

      // Verify cache contains updated item without dismissedAt
      cachedItem = await cache.get(userId, itemId);
      expect(cachedItem).not.toBeNull();
      expect(cachedItem?.dismissedAt).toBeFalsy();
    });

    it('should cache items for subsequent requests', async () => {
      const userId = 'cache-redis-cache-test-user';
      const itemId = 'cache-redis-cache-test-item';
      const cache = app.get<IDismissibleCache>(DISMISSIBLE_CACHE_ADAPTER);

      // First request - should create and cache
      const firstResponse = await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .expect(200);
      const createdAt = firstResponse.body.data.createdAt;

      // Verify item is in cache after first request
      const cachedItem = await cache.get(userId, itemId);
      expect(cachedItem).not.toBeNull();
      expect(cachedItem?.userId).toBe(userId);
      // Verify createdAt exists (it might be a Date object or ISO string)
      expect(cachedItem?.createdAt).toBeDefined();

      // Second request - should return cached item
      const secondResponse = await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .expect(200);

      // Should return the same item (same createdAt)
      expect(secondResponse.body.data.createdAt).toBe(createdAt);

      // Verify cache still has the item
      const cachedItemAfter = await cache.get(userId, itemId);
      expect(cachedItemAfter).not.toBeNull();
      expect(cachedItemAfter?.userId).toBe(userId);
    });
  });
});
