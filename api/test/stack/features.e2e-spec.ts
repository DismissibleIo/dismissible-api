import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import createJWKSMock, { JWKSMock } from 'mock-jwks';
import { setupServer, SetupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { DISMISSIBLE_STORAGE_ADAPTER, IDismissibleStorage } from '@dismissible/nestjs-storage';
import { STORAGE_BACKENDS, createStackApp, uniqueId } from './stack';

const AUTH_DOMAIN = 'https://auth.stack.local';
const ISSUER = `${AUTH_DOMAIN}/`;
const AUDIENCE = 'dismissible-api';
const ORIGIN = 'https://app.example.com';

const STORAGE_TYPES = STORAGE_BACKENDS.map(([storage]) => storage);

describe.each(STORAGE_TYPES)('Features with storage=%s and cache=redis', (storage) => {
  let app: INestApplication;

  afterEach(async () => {
    await app.close();
  });

  const isStored = async (userId: string, itemId: string) =>
    (await app.get<IDismissibleStorage>(DISMISSIBLE_STORAGE_ADAPTER).get(userId, itemId)) !== null;

  describe('rate limiter', () => {
    const rateLimitEnv = {
      DISMISSIBLE_RATE_LIMITER_ENABLED: 'true',
      DISMISSIBLE_RATE_LIMITER_POINTS: '2',
      DISMISSIBLE_RATE_LIMITER_DURATION: '60',
    };

    it('should reject requests over the limit before they reach storage', async () => {
      app = await createStackApp(storage, 'redis', rateLimitEnv);
      const userId = uniqueId('user');
      const limited = uniqueId('item');
      const get = (itemId: string) =>
        request(app.getHttpServer())
          .get(`/v1/users/${userId}/items/${itemId}`)
          .set('x-forwarded-for', '203.0.113.10');

      await get(uniqueId('item')).expect(200);
      await get(uniqueId('item')).expect(200);
      await get(limited).expect(429);

      expect(await isStored(userId, limited)).toBe(false);
    });

    it('should not limit requests from an ignored origin', async () => {
      app = await createStackApp(storage, 'redis', {
        ...rateLimitEnv,
        DISMISSIBLE_RATE_LIMITER_KEY_TYPE: 'origin',
        DISMISSIBLE_RATE_LIMITER_IGNORED_KEYS: 'app.example.com, other.example.com',
      });
      const userId = uniqueId('user');

      for (let i = 0; i < 4; i++) {
        await request(app.getHttpServer())
          .get(`/v1/users/${userId}/items/${uniqueId('item')}`)
          .set('origin', ORIGIN)
          .expect(200);
      }
    });

    it('should not limit requests when disabled', async () => {
      app = await createStackApp(storage, 'redis', {
        ...rateLimitEnv,
        DISMISSIBLE_RATE_LIMITER_ENABLED: 'false',
      });
      const userId = uniqueId('user');

      for (let i = 0; i < 4; i++) {
        await request(app.getHttpServer())
          .get(`/v1/users/${userId}/items/${uniqueId('item')}`)
          .set('x-forwarded-for', '203.0.113.11')
          .expect(200);
      }
    });
  });

  describe('JWT auth', () => {
    let jwksMock: JWKSMock;
    let server: SetupServer;

    beforeAll(() => {
      jwksMock = createJWKSMock(AUTH_DOMAIN);
      server = setupServer(
        http.get(`${AUTH_DOMAIN}/.well-known/openid-configuration`, () =>
          HttpResponse.json({ issuer: ISSUER, jwks_uri: `${AUTH_DOMAIN}/.well-known/jwks.json` }),
        ),
        jwksMock.mswHandler,
      );
      server.listen({ onUnhandledRequest: 'bypass' });
    });

    afterAll(() => {
      server.close();
    });

    beforeEach(async () => {
      app = await createStackApp(storage, 'redis', {
        DISMISSIBLE_JWT_AUTH_ENABLED: 'true',
        DISMISSIBLE_JWT_AUTH_WELL_KNOWN_URL: `${AUTH_DOMAIN}/.well-known/openid-configuration`,
        DISMISSIBLE_JWT_AUTH_ISSUER: ISSUER,
        DISMISSIBLE_JWT_AUTH_AUDIENCE: AUDIENCE,
      });
    });

    const tokenFor = (sub: string) => jwksMock.token({ sub, aud: AUDIENCE, iss: ISSUER });

    it('should store items for the authenticated user only', async () => {
      const userId = uniqueId('user');
      const itemId = uniqueId('item');
      const path = `/v1/users/${userId}/items/${itemId}`;

      await request(app.getHttpServer()).get(path).expect(401);
      await request(app.getHttpServer())
        .get(path)
        .set('authorization', `Bearer ${tokenFor(uniqueId('user'))}`)
        .expect(403);
      expect(await isStored(userId, itemId)).toBe(false);

      await request(app.getHttpServer())
        .get(path)
        .set('authorization', `Bearer ${tokenFor(userId)}`)
        .expect(200);
      expect(await isStored(userId, itemId)).toBe(true);
    });
  });
});

describe('HTTP settings', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app.close();
  });

  const preflight = () =>
    request(app.getHttpServer())
      .options('/v1/users/user/items/item')
      .set('origin', ORIGIN)
      .set('access-control-request-method', 'DELETE');

  describe('CORS', () => {
    it('should allow configured origins with the configured settings', async () => {
      app = await createStackApp('memory', 'none', {
        DISMISSIBLE_CORS_ORIGINS: `http://localhost:3000,${ORIGIN}`,
        DISMISSIBLE_CORS_METHODS: 'GET,DELETE',
        DISMISSIBLE_CORS_ALLOWED_HEADERS: 'Authorization,x-custom',
        DISMISSIBLE_CORS_CREDENTIALS: 'false',
        DISMISSIBLE_CORS_MAX_AGE: '120',
      });

      const response = await preflight().expect(204);

      expect(response.headers['access-control-allow-origin']).toBe(ORIGIN);
      expect(response.headers['access-control-allow-methods']).toBe('GET, DELETE');
      expect(response.headers['access-control-allow-headers']).toBe('Authorization, x-custom');
      expect(response.headers['access-control-allow-credentials']).toBeUndefined();
      expect(response.headers['access-control-max-age']).toBe('120');
    });

    it('should not allow other origins', async () => {
      app = await createStackApp('memory', 'none');

      const response = await preflight();

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should not answer preflight requests when disabled', async () => {
      app = await createStackApp('memory', 'none', { DISMISSIBLE_CORS_ENABLED: 'false' });

      const response = await preflight();

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should refuse to boot when enabled without origins', async () => {
      await expect(
        createStackApp('memory', 'none', { DISMISSIBLE_CORS_ORIGINS: '' }),
      ).rejects.toThrow(/origins/);

      app = await createStackApp('memory', 'none');
    });
  });

  describe('Helmet', () => {
    const health = () => request(app.getHttpServer()).get('/health').expect(200);

    it('should send the configured security headers', async () => {
      app = await createStackApp('memory', 'none', {
        DISMISSIBLE_HELMET_CSP: 'true',
        DISMISSIBLE_HELMET_COEP: 'true',
        DISMISSIBLE_HELMET_HSTS_MAX_AGE: '600',
        DISMISSIBLE_HELMET_HSTS_INCLUDE_SUBDOMAINS: 'false',
        DISMISSIBLE_HELMET_HSTS_PRELOAD: 'true',
      });

      const { headers } = await health();

      expect(headers['content-security-policy']).toBeDefined();
      expect(headers['cross-origin-embedder-policy']).toBe('require-corp');
      expect(headers['strict-transport-security']).toBe('max-age=600; preload');
    });

    it('should leave out CSP and COEP when they are turned off', async () => {
      app = await createStackApp('memory', 'none', {
        DISMISSIBLE_HELMET_CSP: 'false',
        DISMISSIBLE_HELMET_COEP: 'false',
      });

      const { headers } = await health();

      expect(headers['content-security-policy']).toBeUndefined();
      expect(headers['cross-origin-embedder-policy']).toBeUndefined();
      expect(headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains');
    });

    it('should send no security headers when disabled', async () => {
      app = await createStackApp('memory', 'none', { DISMISSIBLE_HELMET_ENABLED: 'false' });

      const { headers } = await health();

      expect(headers['strict-transport-security']).toBeUndefined();
    });
  });

  describe('Swagger', () => {
    it('should serve the document at the configured path', async () => {
      app = await createStackApp('memory', 'none', { DISMISSIBLE_SWAGGER_PATH: 'api-docs' });

      const response = await request(app.getHttpServer()).get('/api-docs-json').expect(200);

      expect(response.body.openapi).toBeDefined();
    });

    it('should not serve the document when disabled', async () => {
      app = await createStackApp('memory', 'none', { DISMISSIBLE_SWAGGER_ENABLED: 'false' });

      await request(app.getHttpServer()).get('/docs-json').expect(404);
    });
  });

  describe('Validation', () => {
    const invalidBatch = () =>
      request(app.getHttpServer())
        .post('/v1/users/user/items')
        .send({ items: ['item'], unknown: true })
        .expect(400);

    it('should hide error details by default', async () => {
      app = await createStackApp('memory', 'none');

      const response = await invalidBatch();

      expect(JSON.stringify(response.body)).not.toContain('unknown');
    });

    it('should explain errors when messages are enabled', async () => {
      app = await createStackApp('memory', 'none', {
        DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES: 'false',
      });

      const response = await invalidBatch();

      expect(JSON.stringify(response.body)).toContain('unknown');
    });

    it('should accept unknown properties when not forbidden', async () => {
      app = await createStackApp('memory', 'none', {
        DISMISSIBLE_VALIDATION_FORBID_NON_WHITELISTED: 'false',
      });

      await request(app.getHttpServer())
        .post('/v1/users/user/items')
        .send({ items: ['item'], unknown: true })
        .expect(201);
    });
  });
});
