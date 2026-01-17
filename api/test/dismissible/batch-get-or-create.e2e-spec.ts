import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { join } from 'path';
import { createTestApp, cleanupTestData } from '../../src/app-test.factory';
import { NullLogger } from '@dismissible/nestjs-logger';

describe('POST /v1/users/:userId/items (batch-get-or-create)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp({
      moduleOptions: {
        configPath: join(__dirname, '../config/default'),
        logger: NullLogger,
      },
    });
    await cleanupTestData(app);
  });

  afterAll(async () => {
    await cleanupTestData(app);
    await app.close();
  });

  it('should create new items on first request', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/users/batch-user-1/items')
      .send({ items: ['batch-banner-1', 'batch-banner-2'] })
      .expect(201);

    expect(response.body.data).toBeDefined();
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].itemId).toBe('batch-banner-1');
    expect(response.body.data[0].userId).toBe('batch-user-1');
    expect(response.body.data[0].createdAt).toBeDefined();
    expect(response.body.data[0].dismissedAt).toBeUndefined();
    expect(response.body.data[1].itemId).toBe('batch-banner-2');
    expect(response.body.data[1].userId).toBe('batch-user-1');
  });

  it('should return existing items on subsequent requests', async () => {
    const userId = 'batch-user-2';
    const itemIds = ['batch-banner-3', 'batch-banner-4'];

    const firstResponse = await request(app.getHttpServer())
      .post(`/v1/users/${userId}/items`)
      .send({ items: itemIds })
      .expect(201);

    const createdAt0 = firstResponse.body.data[0].createdAt;
    const createdAt1 = firstResponse.body.data[1].createdAt;

    const secondResponse = await request(app.getHttpServer())
      .post(`/v1/users/${userId}/items`)
      .send({ items: itemIds })
      .expect(201);

    expect(secondResponse.body.data).toHaveLength(2);
    expect(secondResponse.body.data[0].itemId).toBe('batch-banner-3');
    expect(secondResponse.body.data[0].createdAt).toBe(createdAt0);
    expect(secondResponse.body.data[1].itemId).toBe('batch-banner-4');
    expect(secondResponse.body.data[1].createdAt).toBe(createdAt1);
  });

  it('should handle mix of existing and new items', async () => {
    const userId = 'batch-user-4';

    // Create one item first
    await request(app.getHttpServer()).get(`/v1/users/${userId}/items/existing-item`).expect(200);

    // Request batch with the existing item and a new one
    const response = await request(app.getHttpServer())
      .post(`/v1/users/${userId}/items`)
      .send({ items: ['existing-item', 'new-batch-item'] })
      .expect(201);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].itemId).toBe('existing-item');
    expect(response.body.data[1].itemId).toBe('new-batch-item');
  });

  it('should return 400 when items array is empty', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/users/batch-user-5/items')
      .send({ items: [] })
      .expect(400);

    expect(response.body.error).toBeDefined();
  });

  it('should return 400 when items array is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/users/batch-user-6/items')
      .send({})
      .expect(400);

    expect(response.body.error).toBeDefined();
  });

  it('should return 400 when item ID is invalid', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/users/batch-user-7/items')
      .send({ items: ['valid-item', ''] })
      .expect(400);

    expect(response.body.error).toBeDefined();
  });

  it('should handle single item in batch', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/users/batch-user-8/items')
      .send({ items: ['single-batch-item'] })
      .expect(201);

    expect(response.body.data).toBeDefined();
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].itemId).toBe('single-batch-item');
    expect(response.body.data[0].userId).toBe('batch-user-8');
  });
});
