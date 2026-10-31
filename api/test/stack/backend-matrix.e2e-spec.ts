import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DISMISSIBLE_STORAGE_ADAPTER, IDismissibleStorage } from '@dismissible/nestjs-storage';
import { DISMISSIBLE_CACHE_ADAPTER, IDismissibleCache } from '@dismissible/nestjs-cache';
import { CACHE_BACKENDS, STORAGE_BACKENDS, createStackApp, uniqueId } from './stack';

const BACKEND_COMBINATIONS = STORAGE_BACKENDS.flatMap(([storage, StorageAdapter]) =>
  CACHE_BACKENDS.map(
    ([cache, CacheAdapter]) => [storage, cache, StorageAdapter, CacheAdapter] as const,
  ),
);

// Enough to overlap on the database connection pool
const CONCURRENT_REQUESTS = 25;

describe.each(BACKEND_COMBINATIONS)(
  'API with storage=%s and cache=%s',
  (storage, cache, StorageAdapter, CacheAdapter) => {
    let app: INestApplication;
    let storageAdapter: IDismissibleStorage;
    let cacheAdapter: IDismissibleCache;
    let userId: string;
    let itemId: string;

    // Listening keeps supertest from starting and stopping the server around concurrent requests
    const useApp = async (nextApp: INestApplication) => {
      await nextApp.listen(0, '127.0.0.1');
      app = nextApp;
      storageAdapter = app.get(DISMISSIBLE_STORAGE_ADAPTER);
      cacheAdapter = app.get(DISMISSIBLE_CACHE_ADAPTER);
    };

    const itemPath = () => `/v1/users/${userId}/items/${itemId}`;

    beforeAll(async () => {
      await useApp(await createStackApp(storage, cache));
    });

    afterAll(async () => {
      await app.close();
    });

    beforeEach(() => {
      userId = uniqueId('user');
      itemId = uniqueId('item');
    });

    it('should use the selected adapters', () => {
      expect(storageAdapter).toBeInstanceOf(StorageAdapter);
      expect(cacheAdapter).toBeInstanceOf(CacheAdapter);
    });

    it('should keep storage and cache in step through the item lifecycle', async () => {
      const created = await request(app.getHttpServer()).get(itemPath()).expect(200);
      expect(created.body.data).toMatchObject({ itemId, userId });
      expect(created.body.data.dismissedAt).toBeUndefined();
      expect((await storageAdapter.get(userId, itemId))?.dismissedAt).toBeFalsy();

      const dismissed = await request(app.getHttpServer()).delete(itemPath()).expect(200);
      expect(dismissed.body.data.dismissedAt).toBeDefined();
      expect((await storageAdapter.get(userId, itemId))?.dismissedAt).toBeTruthy();
      if (cache !== 'none') {
        expect((await cacheAdapter.get(userId, itemId))?.dismissedAt).toBeTruthy();
      }

      const read = await request(app.getHttpServer()).get(itemPath()).expect(200);
      expect(read.body.data.dismissedAt).toBe(dismissed.body.data.dismissedAt);
      expect(read.body.data.createdAt).toBe(created.body.data.createdAt);

      const restored = await request(app.getHttpServer()).post(itemPath()).expect(201);
      expect(restored.body.data.dismissedAt).toBeUndefined();
      expect((await storageAdapter.get(userId, itemId))?.dismissedAt).toBeFalsy();
      if (cache !== 'none') {
        expect((await cacheAdapter.get(userId, itemId))?.dismissedAt).toBeFalsy();
      }
    });

    it('should reject invalid state changes', async () => {
      const notFound = await request(app.getHttpServer()).delete(itemPath()).expect(400);
      expect(notFound.body.error.message).toContain('not found');

      await request(app.getHttpServer()).get(itemPath()).expect(200);
      const notDismissed = await request(app.getHttpServer()).post(itemPath()).expect(400);
      expect(notDismissed.body.error.message).toContain('not dismissed');

      await request(app.getHttpServer()).delete(itemPath()).expect(200);
      const alreadyDismissed = await request(app.getHttpServer()).delete(itemPath()).expect(400);
      expect(alreadyDismissed.body.error.message).toContain('already dismissed');
    });

    it('should return the same item to concurrent first requests', async () => {
      const responses = await Promise.all(
        Array.from({ length: CONCURRENT_REQUESTS }, () =>
          request(app.getHttpServer()).get(itemPath()),
        ),
      );

      expect(responses.map(({ status }) => status)).toEqual(Array(CONCURRENT_REQUESTS).fill(200));
      const stored = await storageAdapter.get(userId, itemId);
      for (const response of responses) {
        expect(response.body.data.createdAt).toBe(stored?.createdAt.toISOString());
      }
    });

    it('should accept concurrent batch requests for the same new items', async () => {
      const items = [itemId, uniqueId('item')];

      const responses = await Promise.all(
        Array.from({ length: CONCURRENT_REQUESTS }, () =>
          request(app.getHttpServer()).post(`/v1/users/${userId}/items`).send({ items }),
        ),
      );

      expect(responses.map(({ status }) => status)).toEqual(Array(CONCURRENT_REQUESTS).fill(201));
      for (const response of responses) {
        expect(response.body.data).toHaveLength(2);
      }
    });

    it('should batch get existing items and create missing ones', async () => {
      const newItemId = uniqueId('item');
      await request(app.getHttpServer()).get(itemPath()).expect(200);
      await request(app.getHttpServer()).delete(itemPath()).expect(200);

      const response = await request(app.getHttpServer())
        .post(`/v1/users/${userId}/items`)
        .send({ items: [itemId, newItemId] })
        .expect(201);

      const items = new Map(
        response.body.data.map((item: { itemId: string }) => [item.itemId, item]),
      );
      expect(items.get(itemId)).toHaveProperty('dismissedAt');
      expect(items.get(newItemId)).not.toHaveProperty('dismissedAt');
      expect(await storageAdapter.get(userId, newItemId)).not.toBeNull();
    });

    it(`should ${cache === 'none' ? 'read from storage' : 'serve reads from the cache'}`, async () => {
      await request(app.getHttpServer()).get(itemPath()).expect(200);
      await request(app.getHttpServer()).delete(itemPath()).expect(200);

      await storageAdapter.delete(userId, itemId);

      const response = await request(app.getHttpServer()).get(itemPath()).expect(200);
      if (cache === 'none') {
        expect(response.body.data.dismissedAt).toBeUndefined();
      } else {
        expect(response.body.data.dismissedAt).toBeDefined();
      }
    });

    const survivesRestart = storage !== 'memory' || cache === 'redis';

    it(`should ${survivesRestart ? 'keep' : 'lose'} dismissed items across a restart`, async () => {
      await request(app.getHttpServer()).get(itemPath()).expect(200);
      await request(app.getHttpServer()).delete(itemPath()).expect(200);

      await app.close();
      await useApp(await createStackApp(storage, cache));

      const response = await request(app.getHttpServer()).get(itemPath()).expect(200);
      if (survivesRestart) {
        expect(response.body.data.dismissedAt).toBeDefined();
      } else {
        expect(response.body.data.dismissedAt).toBeUndefined();
      }
    });
  },
);
