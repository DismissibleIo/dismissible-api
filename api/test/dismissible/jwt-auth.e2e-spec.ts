import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { join } from 'path';
import { createTestApp, cleanupTestData } from '../../src/app-test.factory';
import { JwtAuthService, IJwtValidationResult } from '@dismissible/nestjs-jwt-auth-hook';
import { NullLogger } from '@dismissible/nestjs-logger';

describe('JWT Authentication E2E', () => {
  let app: INestApplication;
  let mockValidateToken: jest.Mock;

  const createValidResult = (sub = 'test-user'): IJwtValidationResult => ({
    valid: true,
    payload: {
      sub,
      iss: 'https://auth.example.com',
      aud: 'dismissible-api',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    },
  });

  const createInvalidResult = (error: string): IJwtValidationResult => ({
    valid: false,
    error,
  });

  beforeAll(async () => {
    mockValidateToken = jest.fn();

    app = await createTestApp({
      moduleOptions: {
        configPath: join(__dirname, '../config/jwt-auth'),
        logger: NullLogger,
      },
      customize: (builder) => {
        return builder.overrideProvider(JwtAuthService).useValue({
          initializeJwksClient: jest.fn().mockResolvedValue(undefined),
          extractBearerToken: (authHeader: string | undefined) => {
            if (!authHeader) return null;
            const parts = authHeader.split(' ');
            if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
            return parts[1];
          },
          validateToken: mockValidateToken,
        });
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

  beforeEach(() => {
    mockValidateToken.mockReset();
  });

  describe('Successful authentication scenarios', () => {
    it('should allow GET request with valid bearer token', async () => {
      mockValidateToken.mockResolvedValue(createValidResult('auth-user-1'));

      const response = await request(app.getHttpServer())
        .get('/v1/users/auth-user-1/items/jwt-test-get')
        .set('Authorization', 'Bearer valid-token-123')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.itemId).toBe('jwt-test-get');
      expect(response.body.data.userId).toBe('auth-user-1');
      expect(mockValidateToken).toHaveBeenCalledWith('valid-token-123');
    });

    it('should allow DELETE (dismiss) request with valid bearer token', async () => {
      mockValidateToken.mockResolvedValue(createValidResult('auth-user-2'));

      await request(app.getHttpServer())
        .get('/v1/users/auth-user-2/items/jwt-test-dismiss')
        .set('Authorization', 'Bearer valid-token-123')
        .expect(200);

      const response = await request(app.getHttpServer())
        .delete('/v1/users/auth-user-2/items/jwt-test-dismiss')
        .set('Authorization', 'Bearer valid-token-123')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.dismissedAt).toBeDefined();
    });

    it('should allow POST (restore) request with valid bearer token', async () => {
      mockValidateToken.mockResolvedValue(createValidResult('auth-user-3'));

      await request(app.getHttpServer())
        .get('/v1/users/auth-user-3/items/jwt-test-restore')
        .set('Authorization', 'Bearer valid-token-123')
        .expect(200);

      await request(app.getHttpServer())
        .delete('/v1/users/auth-user-3/items/jwt-test-restore')
        .set('Authorization', 'Bearer valid-token-123')
        .expect(200);

      const response = await request(app.getHttpServer())
        .post('/v1/users/auth-user-3/items/jwt-test-restore')
        .set('Authorization', 'Bearer valid-token-123')
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.dismissedAt).toBeUndefined();
    });

    it('should handle lowercase bearer prefix', async () => {
      mockValidateToken.mockResolvedValue(createValidResult('auth-user-4'));

      const response = await request(app.getHttpServer())
        .get('/v1/users/auth-user-4/items/jwt-test-lowercase')
        .set('Authorization', 'bearer lowercase-token')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(mockValidateToken).toHaveBeenCalledWith('lowercase-token');
    });
  });

  describe('Failed authentication scenarios', () => {
    it('should reject request without Authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users/noauth-user/items/jwt-test-noheader')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('Missing or invalid bearer token');
      expect(mockValidateToken).not.toHaveBeenCalled();
    });

    it('should reject request with empty Authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users/noauth-user/items/jwt-test-empty')
        .set('Authorization', '')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('Missing or invalid bearer token');
    });

    it('should reject request with non-Bearer auth scheme', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users/noauth-user/items/jwt-test-basic')
        .set('Authorization', 'Basic dXNlcjpwYXNz')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('Missing or invalid bearer token');
    });

    it('should reject request with Bearer but no token', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users/noauth-user/items/jwt-test-notoken')
        .set('Authorization', 'Bearer')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('Missing or invalid bearer token');
    });

    it('should reject request with expired token', async () => {
      mockValidateToken.mockResolvedValue(createInvalidResult('jwt expired'));

      const response = await request(app.getHttpServer())
        .get('/v1/users/expired-user/items/jwt-test-expired')
        .set('Authorization', 'Bearer expired-token')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('jwt expired');
      expect(mockValidateToken).toHaveBeenCalledWith('expired-token');
    });

    it('should reject request with invalid token signature', async () => {
      mockValidateToken.mockResolvedValue(createInvalidResult('invalid signature'));

      const response = await request(app.getHttpServer())
        .get('/v1/users/invalid-user/items/jwt-test-invalid-sig')
        .set('Authorization', 'Bearer tampered-token')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('invalid signature');
    });

    it('should reject request with malformed token', async () => {
      mockValidateToken.mockResolvedValue(createInvalidResult('Invalid token format'));

      const response = await request(app.getHttpServer())
        .get('/v1/users/malformed-user/items/jwt-test-malformed')
        .set('Authorization', 'Bearer not.a.valid.jwt.token')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('Invalid token format');
    });

    it('should reject request when token is missing key ID (kid)', async () => {
      mockValidateToken.mockResolvedValue(createInvalidResult('Token missing key ID (kid)'));

      const response = await request(app.getHttpServer())
        .get('/v1/users/nokid-user/items/jwt-test-nokid')
        .set('Authorization', 'Bearer token-without-kid')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('Token missing key ID');
    });

    it('should reject request when signing key cannot be found', async () => {
      mockValidateToken.mockResolvedValue(createInvalidResult('Unable to find signing key'));

      const response = await request(app.getHttpServer())
        .get('/v1/users/nokey-user/items/jwt-test-nokey')
        .set('Authorization', 'Bearer token-with-unknown-kid')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('Unable to find signing key');
    });

    it('should reject dismiss request without valid token', async () => {
      mockValidateToken.mockResolvedValue(createValidResult('dismiss-noauth-user'));

      await request(app.getHttpServer())
        .get('/v1/users/dismiss-noauth-user/items/jwt-test-dismiss-fail')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      mockValidateToken.mockReset();

      const response = await request(app.getHttpServer())
        .delete('/v1/users/dismiss-noauth-user/items/jwt-test-dismiss-fail')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('Missing or invalid bearer token');
    });

    it('should reject restore request without valid token', async () => {
      mockValidateToken.mockResolvedValue(createValidResult('restore-noauth-user'));

      await request(app.getHttpServer())
        .get('/v1/users/restore-noauth-user/items/jwt-test-restore-fail')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      await request(app.getHttpServer())
        .delete('/v1/users/restore-noauth-user/items/jwt-test-restore-fail')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      mockValidateToken.mockReset();

      const response = await request(app.getHttpServer())
        .post('/v1/users/restore-noauth-user/items/jwt-test-restore-fail')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('Missing or invalid bearer token');
    });
  });

  describe('Token validation edge cases', () => {
    it('should validate token for each request independently', async () => {
      mockValidateToken.mockResolvedValueOnce(createValidResult('multi-user'));

      await request(app.getHttpServer())
        .get('/v1/users/multi-user/items/jwt-test-multi-1')
        .set('Authorization', 'Bearer token-1')
        .expect(200);

      mockValidateToken.mockResolvedValueOnce(createValidResult('multi-user'));

      await request(app.getHttpServer())
        .get('/v1/users/multi-user/items/jwt-test-multi-2')
        .set('Authorization', 'Bearer token-2')
        .expect(200);

      expect(mockValidateToken).toHaveBeenCalledTimes(2);
      expect(mockValidateToken).toHaveBeenNthCalledWith(1, 'token-1');
      expect(mockValidateToken).toHaveBeenNthCalledWith(2, 'token-2');
    });

    it('should handle validation service errors gracefully', async () => {
      mockValidateToken.mockRejectedValue(new Error('JWKS client error'));

      const response = await request(app.getHttpServer())
        .get('/v1/users/error-user/items/jwt-test-error')
        .set('Authorization', 'Bearer some-token')
        .expect(500);

      expect(response.body.statusCode).toBe(500);
    });

    it('should reject token with wrong issuer', async () => {
      mockValidateToken.mockResolvedValue(
        createInvalidResult('jwt issuer invalid. expected: https://auth.example.com'),
      );

      const response = await request(app.getHttpServer())
        .get('/v1/users/issuer-user/items/jwt-test-issuer')
        .set('Authorization', 'Bearer wrong-issuer-token')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('issuer invalid');
    });

    it('should reject token with wrong audience', async () => {
      mockValidateToken.mockResolvedValue(
        createInvalidResult('jwt audience invalid. expected: dismissible-api'),
      );

      const response = await request(app.getHttpServer())
        .get('/v1/users/audience-user/items/jwt-test-audience')
        .set('Authorization', 'Bearer wrong-audience-token')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('audience invalid');
    });
  });
});
