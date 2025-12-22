import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { mock } from 'ts-jest-mocker';
import { JwtAuthHook } from './jwt-auth.hook';
import { JwtAuthService, IJwtValidationResult } from './jwt-auth.service';
import { JwtAuthHookConfig } from './jwt-auth-hook.config';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';
import { IRequestContext } from '@dismissible/nestjs-dismissible-request';

function createMinimalContext(overrides: Partial<IRequestContext> = {}): IRequestContext {
  return {
    requestId: 'req-123',
    headers: {},
    query: {},
    params: {},
    body: {},
    user: {},
    ip: '127.0.0.1',
    method: 'GET',
    url: '/test',
    protocol: 'http',
    secure: false,
    hostname: 'localhost',
    port: 3000,
    path: '/test',
    search: '',
    searchParams: {},
    origin: 'http://localhost:3000',
    referer: '',
    userAgent: 'test-agent',
    ...overrides,
  };
}

describe('JwtAuthHook', () => {
  let hook: JwtAuthHook;
  let mockJwtAuthService: jest.Mocked<JwtAuthService>;
  let mockLogger: jest.Mocked<IDismissibleLogger>;
  let mockConfig: JwtAuthHookConfig;

  const testItemId = 'test-item-id';
  const testUserId = 'test-user-id';

  beforeEach(() => {
    mockJwtAuthService = mock(JwtAuthService, { failIfMockNotProvided: false });
    mockLogger = mock<IDismissibleLogger>({ failIfMockNotProvided: false });
    mockConfig = {
      enabled: true,
      wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
      issuer: 'https://auth.example.com',
    };

    hook = new JwtAuthHook(mockJwtAuthService, mockConfig, mockLogger);
  });

  describe('priority', () => {
    it('should default to -100 priority', () => {
      expect(hook.priority).toBe(-100);
    });

    it('should use custom priority when provided', () => {
      const customConfig = { ...mockConfig, priority: -50 };
      const customHook = new JwtAuthHook(mockJwtAuthService, customConfig, mockLogger);
      expect(customHook.priority).toBe(-50);
    });
  });

  describe('onBeforeRequest', () => {
    it('should skip validation and proceed when disabled', async () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const disabledHook = new JwtAuthHook(mockJwtAuthService, disabledConfig, mockLogger);

      const context = createMinimalContext();
      const result = await disabledHook.onBeforeRequest(testItemId, testUserId, context);

      expect(result.proceed).toBe(true);
      expect(mockJwtAuthService.extractBearerToken).not.toHaveBeenCalled();
      expect(mockJwtAuthService.validateToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when no authorization header is present', async () => {
      mockJwtAuthService.extractBearerToken.mockReturnValue(null);

      const context = createMinimalContext();

      await expect(hook.onBeforeRequest(testItemId, testUserId, context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(hook.onBeforeRequest(testItemId, testUserId, context)).rejects.toThrow(
        'Missing or invalid bearer token',
      );
      expect(mockJwtAuthService.extractBearerToken).toHaveBeenCalledWith(undefined);
    });

    it('should throw UnauthorizedException when authorization header is malformed', async () => {
      mockJwtAuthService.extractBearerToken.mockReturnValue(null);

      const context = createMinimalContext({
        headers: { authorization: 'Basic abc123' },
      });

      await expect(hook.onBeforeRequest(testItemId, testUserId, context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(hook.onBeforeRequest(testItemId, testUserId, context)).rejects.toThrow(
        'Missing or invalid bearer token',
      );
    });

    it('should throw UnauthorizedException when token validation fails', async () => {
      const validationResult: IJwtValidationResult = {
        valid: false,
        error: 'Token expired',
      };
      mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
      mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

      const context = createMinimalContext({
        headers: { authorization: 'Bearer valid-token' },
      });

      await expect(hook.onBeforeRequest(testItemId, testUserId, context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(hook.onBeforeRequest(testItemId, testUserId, context)).rejects.toThrow(
        'Token expired',
      );
      expect(mockJwtAuthService.validateToken).toHaveBeenCalledWith('valid-token');
    });

    it('should proceed when token is valid', async () => {
      const matchingUserId = 'user-123';
      const validationResult: IJwtValidationResult = {
        valid: true,
        payload: {
          sub: matchingUserId,
          iss: 'https://auth.example.com',
        },
      };
      mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
      mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

      const context = createMinimalContext({
        headers: { authorization: 'Bearer valid-token' },
      });
      const result = await hook.onBeforeRequest(testItemId, matchingUserId, context);

      expect(result.proceed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should throw UnauthorizedException when context is missing', async () => {
      mockJwtAuthService.extractBearerToken.mockReturnValue(null);

      await expect(hook.onBeforeRequest(testItemId, testUserId, undefined)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockJwtAuthService.extractBearerToken).toHaveBeenCalledWith(undefined);
    });

    it('should log debug message on successful validation', async () => {
      const matchingUserId = 'user-123';
      const validationResult: IJwtValidationResult = {
        valid: true,
        payload: { sub: matchingUserId },
      };
      mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
      mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

      const context = createMinimalContext({
        headers: { authorization: 'Bearer valid-token' },
      });
      await hook.onBeforeRequest(testItemId, matchingUserId, context);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'JWT auth hook: Token validated successfully',
        expect.objectContaining({
          itemId: testItemId,
          userId: matchingUserId,
          requestId: 'req-123',
          subject: matchingUserId,
        }),
      );
    });

    it('should throw ForbiddenException when userId does not match JWT sub claim', async () => {
      const validationResult: IJwtValidationResult = {
        valid: true,
        payload: {
          sub: 'different-user-id',
          iss: 'https://auth.example.com',
        },
      };
      mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
      mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

      const context = createMinimalContext({
        headers: { authorization: 'Bearer valid-token' },
      });

      await expect(hook.onBeforeRequest(testItemId, testUserId, context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(hook.onBeforeRequest(testItemId, testUserId, context)).rejects.toThrow(
        'User ID in request does not match authenticated user',
      );

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'JWT auth hook: User ID mismatch',
        expect.objectContaining({
          itemId: testItemId,
          userId: testUserId,
          requestId: 'req-123',
          tokenSubject: 'different-user-id',
        }),
      );
    });

    it('should proceed when userId matches JWT sub claim', async () => {
      const validationResult: IJwtValidationResult = {
        valid: true,
        payload: {
          sub: testUserId,
          iss: 'https://auth.example.com',
        },
      };
      mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
      mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

      const context = createMinimalContext({
        headers: { authorization: 'Bearer valid-token' },
      });
      const result = await hook.onBeforeRequest(testItemId, testUserId, context);

      expect(result.proceed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should proceed when verifyUserIdMatch is disabled even if userId does not match', async () => {
      const disabledVerifyConfig = { ...mockConfig, verifyUserIdMatch: false };
      const disabledVerifyHook = new JwtAuthHook(
        mockJwtAuthService,
        disabledVerifyConfig,
        mockLogger,
      );

      const validationResult: IJwtValidationResult = {
        valid: true,
        payload: {
          sub: 'different-user-id',
          iss: 'https://auth.example.com',
        },
      };
      mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
      mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

      const context = createMinimalContext({
        headers: { authorization: 'Bearer valid-token' },
      });
      const result = await disabledVerifyHook.onBeforeRequest(testItemId, testUserId, context);

      expect(result.proceed).toBe(true);
    });

    it('should proceed when JWT payload does not have sub claim and verifyUserIdMatch is enabled', async () => {
      const validationResult: IJwtValidationResult = {
        valid: true,
        payload: {
          iss: 'https://auth.example.com',
        },
      };
      mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
      mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

      const context = createMinimalContext({
        headers: { authorization: 'Bearer valid-token' },
      });
      const result = await hook.onBeforeRequest(testItemId, testUserId, context);

      expect(result.proceed).toBe(true);
    });

    it('should proceed when JWT payload is undefined and verifyUserIdMatch is enabled', async () => {
      const validationResult: IJwtValidationResult = {
        valid: true,
      };
      mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
      mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

      const context = createMinimalContext({
        headers: { authorization: 'Bearer valid-token' },
      });
      const result = await hook.onBeforeRequest(testItemId, testUserId, context);

      expect(result.proceed).toBe(true);
    });
  });
});
