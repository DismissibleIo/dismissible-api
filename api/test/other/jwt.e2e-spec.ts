import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { join } from 'path';
import { createTestApp, cleanupTestData } from '../../src/app-test.factory';
import { NullLogger } from '@dismissible/nestjs-logger';
import createJWKSMock, { JWKSMock } from 'mock-jwks';
import { setupServer, SetupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const AUTH_DOMAIN = 'https://auth.test.local';
const ISSUER = 'https://auth.test.local/';
const AUDIENCE = 'dismissible-api';

describe('JWT Authentication E2E', () => {
  let app: INestApplication;
  let jwksMock: JWKSMock;
  let server: SetupServer;

  /**
   * Generate a valid JWT token with the given claims
   */
  function generateToken(claims: {
    sub?: string;
    aud?: string;
    iss?: string;
    exp?: number;
    [key: string]: unknown;
  }): string {
    const tokenClaims: Record<string, unknown> = {
      aud: claims.aud ?? AUDIENCE,
      iss: claims.iss ?? ISSUER,
    };

    // Only add sub if provided
    if (claims.sub !== undefined) {
      tokenClaims.sub = claims.sub;
    }

    // Only add exp if explicitly provided
    if (claims.exp !== undefined) {
      tokenClaims.exp = claims.exp;
    }

    return jwksMock.token(tokenClaims);
  }

  beforeAll(async () => {
    // Create the JWKS mock for our test domain
    jwksMock = createJWKSMock(AUTH_DOMAIN);

    // Set up MSW server with both OpenID configuration and JWKS handlers
    server = setupServer(
      // Mock the OpenID configuration endpoint
      http.get(`${AUTH_DOMAIN}/.well-known/openid-configuration`, () => {
        return HttpResponse.json({
          issuer: ISSUER,
          jwks_uri: `${AUTH_DOMAIN}/.well-known/jwks.json`,
          authorization_endpoint: `${AUTH_DOMAIN}/authorize`,
          token_endpoint: `${AUTH_DOMAIN}/oauth/token`,
        });
      }),
      // Use the JWKS mock handler from mock-jwks
      jwksMock.mswHandler,
    );

    // Start the MSW server
    server.listen({ onUnhandledRequest: 'bypass' });

    // Create the test application with JWT auth enabled
    app = await createTestApp({
      moduleOptions: {
        configPath: join(__dirname, '../config/jwt-auth'),
        logger: NullLogger,
      },
    });

    await cleanupTestData(app);
  });

  afterEach(() => {
    // Reset handlers between tests to ensure clean state
    server.resetHandlers();
  });

  afterAll(async () => {
    // Close the MSW server first to release network interceptors
    server.close();

    if (app) {
      await cleanupTestData(app);
      await app.close();
    }
  });

  describe('GET /v1/users/:userId/items/:itemId (get-or-create)', () => {
    it('should return 401 when no Authorization header is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users/test-user/items/test-item')
        .expect(401);

      // Error message can be at response.body.message or response.body.error.message
      const message = response.body.message ?? response.body.error?.message;
      expect(message).toContain('Missing or invalid bearer token');
    });

    it('should return 401 when Authorization header is malformed', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users/test-user/items/test-item')
        .set('Authorization', 'NotBearer sometoken')
        .expect(401);

      const message = response.body.message ?? response.body.error?.message;
      expect(message).toContain('Missing or invalid bearer token');
    });

    it('should return 401 when Authorization header has no token', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users/test-user/items/test-item')
        .set('Authorization', 'Bearer')
        .expect(401);

      const message = response.body.message ?? response.body.error?.message;
      expect(message).toContain('Missing or invalid bearer token');
    });

    it('should return 401 when token is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users/test-user/items/test-item')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      const message = response.body.message ?? response.body.error?.message;
      expect(message).toBeDefined();
    });

    it('should return 403 when token sub does not match userId', async () => {
      const token = generateToken({ sub: 'different-user' });

      const response = await request(app.getHttpServer())
        .get('/v1/users/test-user/items/test-item')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      const message = response.body.message ?? response.body.error?.message;
      expect(message).toContain('User ID in request does not match authenticated user');
    });

    it('should return 200 when token is valid and sub matches userId', async () => {
      const userId = 'jwt-test-user-1';
      const itemId = 'jwt-test-item-1';
      const token = generateToken({ sub: userId });

      const response = await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.itemId).toBe(itemId);
    });
  });

  describe('POST /v1/users/:userId/items (batch-get-or-create)', () => {
    it('should return 401 when no Authorization header is provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/users/test-user/items')
        .send({ items: ['item-1', 'item-2'] })
        .expect(401);

      const message = response.body.message ?? response.body.error?.message;
      expect(message).toContain('Missing or invalid bearer token');
    });

    it('should return 403 when token sub does not match userId', async () => {
      const token = generateToken({ sub: 'different-user' });

      const response = await request(app.getHttpServer())
        .post('/v1/users/test-user/items')
        .send({ items: ['item-1', 'item-2'] })
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      const message = response.body.message ?? response.body.error?.message;
      expect(message).toContain('User ID in request does not match authenticated user');
    });

    it('should return 201 when token is valid and sub matches userId', async () => {
      const userId = 'jwt-batch-user';
      const token = generateToken({ sub: userId });

      const response = await request(app.getHttpServer())
        .post(`/v1/users/${userId}/items`)
        .send({ items: ['jwt-batch-item-1', 'jwt-batch-item-2'] })
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].userId).toBe(userId);
      expect(response.body.data[1].userId).toBe(userId);
    });
  });

  describe('DELETE /v1/users/:userId/items/:itemId (dismiss)', () => {
    const userId = 'jwt-dismiss-user';
    const itemId = 'jwt-dismiss-item';

    beforeAll(async () => {
      // Create the item first
      const token = generateToken({ sub: userId });
      await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should return 401 when no Authorization header is provided', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/v1/users/${userId}/items/${itemId}`)
        .expect(401);

      const message = response.body.message ?? response.body.error?.message;
      expect(message).toContain('Missing or invalid bearer token');
    });

    it('should return 403 when token sub does not match userId', async () => {
      const token = generateToken({ sub: 'different-user' });

      const response = await request(app.getHttpServer())
        .delete(`/v1/users/${userId}/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      const message = response.body.message ?? response.body.error?.message;
      expect(message).toContain('User ID in request does not match authenticated user');
    });

    it('should return 200 when token is valid and sub matches userId', async () => {
      const token = generateToken({ sub: userId });

      const response = await request(app.getHttpServer())
        .delete(`/v1/users/${userId}/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.dismissedAt).toBeDefined();
    });
  });

  describe('POST /v1/users/:userId/items/:itemId (restore)', () => {
    const userId = 'jwt-restore-user';
    const itemId = 'jwt-restore-item';

    beforeAll(async () => {
      // Create and dismiss the item first
      const token = generateToken({ sub: userId });
      await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/v1/users/${userId}/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should return 401 when no Authorization header is provided', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/users/${userId}/items/${itemId}`)
        .expect(401);

      const message = response.body.message ?? response.body.error?.message;
      expect(message).toContain('Missing or invalid bearer token');
    });

    it('should return 403 when token sub does not match userId', async () => {
      const token = generateToken({ sub: 'different-user' });

      const response = await request(app.getHttpServer())
        .post(`/v1/users/${userId}/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      const message = response.body.message ?? response.body.error?.message;
      expect(message).toContain('User ID in request does not match authenticated user');
    });

    it('should return 201 when token is valid and sub matches userId', async () => {
      const token = generateToken({ sub: userId });

      const response = await request(app.getHttpServer())
        .post(`/v1/users/${userId}/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.dismissedAt).toBeUndefined();
    });
  });

  describe('Token validation edge cases', () => {
    it('should return 401 when token has wrong audience', async () => {
      const token = generateToken({
        sub: 'test-user',
        aud: 'wrong-audience',
      });

      const response = await request(app.getHttpServer())
        .get('/v1/users/test-user/items/test-item')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      const message = response.body.message ?? response.body.error?.message;
      expect(message).toBeDefined();
    });

    it('should return 401 when token has wrong issuer', async () => {
      const token = generateToken({
        sub: 'test-user',
        iss: 'https://wrong-issuer.com/',
      });

      const response = await request(app.getHttpServer())
        .get('/v1/users/test-user/items/test-item')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      const message = response.body.message ?? response.body.error?.message;
      expect(message).toBeDefined();
    });

    it('should handle expired tokens gracefully', async () => {
      // Create a token that expired 1 hour ago
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      const token = generateToken({
        sub: 'test-user',
        exp: expiredTime,
      });

      const response = await request(app.getHttpServer())
        .get('/v1/users/test-user/items/test-item')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      const message = response.body.message ?? response.body.error?.message;
      expect(message).toBeDefined();
    });
  });

  describe('Full authenticated CRUD cycle', () => {
    const userId = 'jwt-full-cycle-user';
    const itemId = 'jwt-full-cycle-item';

    it('should complete full create -> dismiss -> restore cycle with valid token', async () => {
      const token = generateToken({ sub: userId });

      // Create (via get-or-create)
      const createResponse = await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(createResponse.body.data.itemId).toBe(itemId);
      expect(createResponse.body.data.userId).toBe(userId);
      expect(createResponse.body.data.dismissedAt).toBeUndefined();

      // Dismiss
      const dismissResponse = await request(app.getHttpServer())
        .delete(`/v1/users/${userId}/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(dismissResponse.body.data.dismissedAt).toBeDefined();

      // Restore
      const restoreResponse = await request(app.getHttpServer())
        .post(`/v1/users/${userId}/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(restoreResponse.body.data.dismissedAt).toBeUndefined();
    });
  });
});
