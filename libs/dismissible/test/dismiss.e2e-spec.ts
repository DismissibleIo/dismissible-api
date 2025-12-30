import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanupTestData } from './app-test.factory';
import { NullLogger } from '@dismissible/nestjs-logger';
import { StorageModule } from '@dismissible/nestjs-storage';

describe('DELETE /v1/users/:userId/items/:id (dismiss)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp({
      moduleOptions: {
        logger: NullLogger,
        storage: StorageModule,
      },
    });
    await cleanupTestData(app);
  });

  afterAll(async () => {
    await cleanupTestData(app);
    await app.close();
  });

  it('should dismiss an existing item', async () => {
    const userId = 'user-dismiss-1';
    await request(app.getHttpServer()).get(`/v1/users/${userId}/items/dismiss-test-1`).expect(200);

    const response = await request(app.getHttpServer())
      .delete(`/v1/users/${userId}/items/dismiss-test-1`)
      .expect(200);

    expect(response.body.data).toBeDefined();
    expect(response.body.data.dismissedAt).toBeDefined();
  });

  it('should return 400 when dismissing non-existent item', async () => {
    const response = await request(app.getHttpServer())
      .delete('/v1/users/user-123/items/non-existent-item')
      .expect(400);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toContain('not found');
  });

  it('should return 400 when dismissing already dismissed item', async () => {
    const userId = 'user-dismiss-2';
    await request(app.getHttpServer()).get(`/v1/users/${userId}/items/dismiss-test-2`).expect(200);

    await request(app.getHttpServer())
      .delete(`/v1/users/${userId}/items/dismiss-test-2`)
      .expect(200);

    const response = await request(app.getHttpServer())
      .delete(`/v1/users/${userId}/items/dismiss-test-2`)
      .expect(400);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toContain('already dismissed');
  });
});
