import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanupTestData } from './app-test.factory';
import { NullLogger } from '@dismissible/nestjs-logger';
import { MemoryStorageModule } from '@dismissible/nestjs-storage';

describe('POST /v1/users/:userId/items (batch-get-or-create)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp({
      moduleOptions: {
        logger: NullLogger,
        storage: MemoryStorageModule.forRoot(),
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
      .post('/v1/users/user-batch-1/items')
      .send({ items: ['banner-1', 'banner-2', 'banner-3'] })
      .expect(201);

    expect(response.body.data).toBeDefined();
    expect(response.body.data).toHaveLength(3);

    expect(response.body.data[0].itemId).toBe('banner-1');
    expect(response.body.data[0].userId).toBe('user-batch-1');
    expect(response.body.data[0].createdAt).toBeDefined();
    expect(response.body.data[0].dismissedAt).toBeUndefined();

    expect(response.body.data[1].itemId).toBe('banner-2');
    expect(response.body.data[2].itemId).toBe('banner-3');
  });

  it('should return existing items on subsequent requests', async () => {
    const firstResponse = await request(app.getHttpServer())
      .post('/v1/users/user-batch-2/items')
      .send({ items: ['existing-1', 'existing-2'] })
      .expect(201);

    const createdAt1 = firstResponse.body.data[0].createdAt;
    const createdAt2 = firstResponse.body.data[1].createdAt;

    const secondResponse = await request(app.getHttpServer())
      .post('/v1/users/user-batch-2/items')
      .send({ items: ['existing-1', 'existing-2'] })
      .expect(201);

    expect(secondResponse.body.data).toHaveLength(2);
    expect(secondResponse.body.data[0].itemId).toBe('existing-1');
    expect(secondResponse.body.data[0].createdAt).toBe(createdAt1);
    expect(secondResponse.body.data[1].itemId).toBe('existing-2');
    expect(secondResponse.body.data[1].createdAt).toBe(createdAt2);
  });

  it('should handle mix of new and existing items', async () => {
    // Create an item first
    await request(app.getHttpServer())
      .post('/v1/users/user-batch-3/items')
      .send({ items: ['pre-existing'] })
      .expect(201);

    // Request a mix of new and existing items
    const response = await request(app.getHttpServer())
      .post('/v1/users/user-batch-3/items')
      .send({ items: ['pre-existing', 'new-item'] })
      .expect(201);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].itemId).toBe('pre-existing');
    expect(response.body.data[1].itemId).toBe('new-item');
  });

  it('should return items in the order requested', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/users/user-batch-4/items')
      .send({ items: ['z-item', 'a-item', 'm-item'] })
      .expect(201);

    expect(response.body.data).toHaveLength(3);
    expect(response.body.data[0].itemId).toBe('z-item');
    expect(response.body.data[1].itemId).toBe('a-item');
    expect(response.body.data[2].itemId).toBe('m-item');
  });

  it('should reject empty items array', async () => {
    await request(app.getHttpServer())
      .post('/v1/users/user-batch-5/items')
      .send({ items: [] })
      .expect(400);
  });

  it('should reject request without items field', async () => {
    await request(app.getHttpServer()).post('/v1/users/user-batch-6/items').send({}).expect(400);
  });
});
