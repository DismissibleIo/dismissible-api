import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { join } from 'path';
import { createTestApp, cleanupTestData } from '../../src/app-test.factory';
import { NullLogger } from '@dismissible/nestjs-logger';

describe('Full lifecycle flow', () => {
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
    if (app) {
      await cleanupTestData(app);
      await app.close();
    }
  });

  it('should handle create -> dismiss -> restore -> dismiss cycle', async () => {
    const userId = 'lifecycle-user';
    const itemId = 'lifecycle-test';

    const createResponse = await request(app.getHttpServer())
      .get(`/v1/users/${userId}/items/${itemId}`)
      .expect(200);

    expect(createResponse.body.data.dismissedAt).toBeUndefined();

    const dismissResponse = await request(app.getHttpServer())
      .delete(`/v1/users/${userId}/items/${itemId}`)
      .expect(200);

    expect(dismissResponse.body.data.dismissedAt).toBeDefined();

    const restoreResponse = await request(app.getHttpServer())
      .post(`/v1/users/${userId}/items/${itemId}`)
      .expect(201);

    expect(restoreResponse.body.data.dismissedAt).toBeUndefined();

    const dismissAgainResponse = await request(app.getHttpServer())
      .delete(`/v1/users/${userId}/items/${itemId}`)
      .expect(200);

    expect(dismissAgainResponse.body.data.dismissedAt).toBeDefined();
  });
});
