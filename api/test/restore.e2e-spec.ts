import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { join } from 'path';
import { createTestApp, cleanupTestData } from '../src/app-test.factory';
import { NullLogger } from '@dismissible/nestjs-logger';

describe('POST /v1/users/:userId/items/:id (restore)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp({
      moduleOptions: {
        configPath: join(__dirname, 'config'),
        logger: NullLogger,
      },
    });
    await cleanupTestData(app);
  });

  afterAll(async () => {
    await cleanupTestData(app);
    await app.close();
  });

  it('should restore a dismissed item', async () => {
    const userId = 'user-restore-1';
    await request(app.getHttpServer()).get(`/v1/users/${userId}/items/restore-test-1`).expect(200);

    await request(app.getHttpServer())
      .delete(`/v1/users/${userId}/items/restore-test-1`)
      .expect(200);

    const response = await request(app.getHttpServer())
      .post(`/v1/users/${userId}/items/restore-test-1`)
      .expect(201);

    expect(response.body.data).toBeDefined();
    expect(response.body.data.dismissedAt).toBeUndefined();
  });

  it('should return 400 when restoring non-existent item', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/users/user-123/items/non-existent-restore')
      .expect(400);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toContain('not found');
  });

  it('should return 400 when restoring non-dismissed item', async () => {
    const userId = 'user-restore-2';
    await request(app.getHttpServer()).get(`/v1/users/${userId}/items/restore-test-2`).expect(200);

    const response = await request(app.getHttpServer())
      .post(`/v1/users/${userId}/items/restore-test-2`)
      .expect(400);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toContain('not dismissed');
  });
});
