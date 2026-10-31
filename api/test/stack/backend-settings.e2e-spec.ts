import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DISMISSIBLE_STORAGE_ADAPTER, IDismissibleStorage } from '@dismissible/nestjs-storage';
import { DISMISSIBLE_CACHE_ADAPTER, IDismissibleCache } from '@dismissible/nestjs-cache';
import { RedisClientService } from '@dismissible/nestjs-redis-cache';
import { createStackApp, uniqueId } from './stack';

/**
 * The Docker image declares every optional setting as an empty environment variable.
 */
const DOCKER_IMAGE_EMPTY_ENV: NodeJS.ProcessEnv = {
  DISMISSIBLE_CACHE_MEMORY_MAX_ITEMS: '',
  DISMISSIBLE_CACHE_MEMORY_TTL_MS: '',
  DISMISSIBLE_CACHE_REDIS_KEY_PREFIX: '',
  DISMISSIBLE_CACHE_REDIS_TTL_MS: '',
  DISMISSIBLE_CACHE_REDIS_ENABLE_READY_CHECK: '',
  DISMISSIBLE_CACHE_REDIS_MAX_RETRIES: '',
  DISMISSIBLE_CACHE_REDIS_CONNECTION_TIMEOUT_MS: '',
  DISMISSIBLE_STORAGE_DYNAMODB_AWS_SESSION_TOKEN: '',
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Backend settings', () => {
  let app: INestApplication;
  const userId = uniqueId('user');

  const getItem = (itemId: string) =>
    request(app.getHttpServer()).get(`/v1/users/${userId}/items/${itemId}`).expect(200);

  afterEach(async () => {
    await app.close();
  });

  describe('empty optional environment variables', () => {
    it.each([
      ['redis', 'memory'],
      ['memory', 'memory'],
      ['redis', 'postgres'],
      ['redis', 'dynamodb'],
    ] as const)('should boot the %s cache with %s storage', async (cache, storage) => {
      app = await createStackApp(storage, cache, DOCKER_IMAGE_EMPTY_ENV);

      const itemId = uniqueId('item');
      await getItem(itemId);

      const cached = await app
        .get<IDismissibleCache>(DISMISSIBLE_CACHE_ADAPTER)
        .get(userId, itemId);
      expect(cached?.userId).toBe(userId);
    });

    it('should apply the redis defaults', async () => {
      app = await createStackApp('memory', 'redis', DOCKER_IMAGE_EMPTY_ENV);

      const itemId = uniqueId('item');
      await getItem(itemId);

      const ttl = await app
        .get(RedisClientService)
        .getClient()
        .ttl(`dismissible:cache:${userId}:${itemId}`);
      expect(ttl).toBeGreaterThan(5 * 60 * 60);
    });
  });

  describe('redis cache', () => {
    it('should write under the default key prefix when no prefix is set', async () => {
      app = await createStackApp('memory', 'redis');

      const itemId = uniqueId('item');
      await getItem(itemId);

      const client = app.get(RedisClientService).getClient();
      expect(await client.exists(`dismissible:cache:${userId}:${itemId}`)).toBe(1);
    });

    it('should apply the key prefix and ttl', async () => {
      app = await createStackApp('memory', 'redis', {
        DISMISSIBLE_CACHE_REDIS_KEY_PREFIX: 'e2e:prefix:',
        DISMISSIBLE_CACHE_REDIS_TTL_MS: '30000',
      });

      const itemId = uniqueId('item');
      await getItem(itemId);

      const client = app.get(RedisClientService).getClient();
      const ttl = await client.ttl(`e2e:prefix:${userId}:${itemId}`);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(30);
    });

    it('should fail to boot when redis cannot be reached', async () => {
      await expect(
        createStackApp('memory', 'redis', {
          DISMISSIBLE_CACHE_REDIS_URL: 'redis://localhost:1',
          DISMISSIBLE_CACHE_REDIS_CONNECTION_TIMEOUT_MS: '200',
        }),
      ).rejects.toThrow(/Redis connection failed/);

      app = await createStackApp('memory', 'none');
    });
  });

  describe('memory cache', () => {
    it('should evict the oldest item beyond maxItems', async () => {
      app = await createStackApp('memory', 'memory', { DISMISSIBLE_CACHE_MEMORY_MAX_ITEMS: '1' });
      const cache = app.get<IDismissibleCache>(DISMISSIBLE_CACHE_ADAPTER);

      const [oldest, newest] = [uniqueId('item'), uniqueId('item')];
      await getItem(oldest);
      await getItem(newest);

      expect(await cache.get(userId, oldest)).toBeNull();
      expect(await cache.get(userId, newest)).not.toBeNull();
    });

    it('should expire items after ttlMs', async () => {
      app = await createStackApp('memory', 'memory', { DISMISSIBLE_CACHE_MEMORY_TTL_MS: '50' });
      const cache = app.get<IDismissibleCache>(DISMISSIBLE_CACHE_ADAPTER);

      const itemId = uniqueId('item');
      await getItem(itemId);
      await sleep(100);

      expect(await cache.get(userId, itemId)).toBeNull();
    });
  });

  describe('memory storage', () => {
    it('should evict the oldest item beyond maxItems', async () => {
      app = await createStackApp('memory', 'none', { DISMISSIBLE_STORAGE_MEMORY_MAX_ITEMS: '1' });
      const storage = app.get<IDismissibleStorage>(DISMISSIBLE_STORAGE_ADAPTER);

      const [oldest, newest] = [uniqueId('item'), uniqueId('item')];
      await getItem(oldest);
      await getItem(newest);

      expect(await storage.get(userId, oldest)).toBeNull();
      expect(await storage.get(userId, newest)).not.toBeNull();
    });

    it('should expire items after ttlMs', async () => {
      app = await createStackApp('memory', 'none', { DISMISSIBLE_STORAGE_MEMORY_TTL_MS: '50' });
      const storage = app.get<IDismissibleStorage>(DISMISSIBLE_STORAGE_ADAPTER);

      const itemId = uniqueId('item');
      await getItem(itemId);
      await sleep(100);

      expect(await storage.get(userId, itemId)).toBeNull();
    });
  });
});
