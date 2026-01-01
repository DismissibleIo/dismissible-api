import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { join } from 'path';
import { createTestApp, cleanupTestData } from '../../src/app-test.factory';
import { NullLogger } from '@dismissible/nestjs-logger';

describe('GET /v1/users/:userId/items/:id (get-or-create)', () => {
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

  it('should create a new item on first request', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/users/user-123/items/test-banner-1')
      .expect(200);

    expect(response.body.data).toBeDefined();
    expect(response.body.data.itemId).toBe('test-banner-1');
    expect(response.body.data.userId).toBe('user-123');
    expect(response.body.data.createdAt).toBeDefined();
    expect(response.body.data.dismissedAt).toBeUndefined();
  });

  it('should return existing item on subsequent requests', async () => {
    const firstResponse = await request(app.getHttpServer())
      .get('/v1/users/user-456/items/test-banner-2')
      .expect(200);

    const createdAt = firstResponse.body.data.createdAt;

    const secondResponse = await request(app.getHttpServer())
      .get('/v1/users/user-456/items/test-banner-2')
      .expect(200);

    expect(secondResponse.body.data.itemId).toBe('test-banner-2');
    expect(secondResponse.body.data.createdAt).toBe(createdAt);
  });
});
