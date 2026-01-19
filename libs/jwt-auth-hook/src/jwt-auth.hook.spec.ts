import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { mock, Mock } from 'ts-jest-mocker';
import { JwtAuthHook } from './jwt-auth.hook';
import { JwtAuthService, IJwtValidationResult } from './jwt-auth.service';
import { JwtAuthHookConfig, UserIdMatchType } from './jwt-auth-hook.config';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';
import { IRequestContext } from '@dismissible/nestjs-request';

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
  let mockJwtAuthService: Mock<JwtAuthService>;
  let mockLogger: Mock<IDismissibleLogger>;
  let mockConfig: JwtAuthHookConfig;

  const testItemId = 'test-item-id';
  const testUserId = 'test-user-id';

  beforeEach(() => {
    mockJwtAuthService = mock(JwtAuthService, { failIfMockNotProvided: false });
    mockLogger = mock<IDismissibleLogger>({ failIfMockNotProvided: false });
    mockConfig = {
      enabled: true,
      wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
      issuer: ['https://auth.example.com'],
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

    it('should proceed when matchUserId is disabled even if userId does not match', async () => {
      const disabledMatchConfig = { ...mockConfig, matchUserId: false };
      const disabledMatchHook = new JwtAuthHook(
        mockJwtAuthService,
        disabledMatchConfig,
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
      const result = await disabledMatchHook.onBeforeRequest(testItemId, testUserId, context);

      expect(result.proceed).toBe(true);
    });

    it('should proceed when JWT payload does not have sub claim and matchUserId is enabled', async () => {
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

    it('should proceed when JWT payload is undefined and matchUserId is enabled', async () => {
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

    describe('custom userIdClaim', () => {
      it('should use custom userIdClaim when provided', async () => {
        const customConfig = { ...mockConfig, userIdClaim: 'custom_user_id' };
        const customHook = new JwtAuthHook(mockJwtAuthService, customConfig, mockLogger);

        const matchingUserId = 'user-123';
        const validationResult: IJwtValidationResult = {
          valid: true,
          payload: {
            custom_user_id: matchingUserId,
            iss: 'https://auth.example.com',
          },
        };
        mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
        mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

        const context = createMinimalContext({
          headers: { authorization: 'Bearer valid-token' },
        });
        const result = await customHook.onBeforeRequest(testItemId, matchingUserId, context);

        expect(result.proceed).toBe(true);
      });

      it('should throw ForbiddenException when custom key value does not match userId', async () => {
        const customConfig = { ...mockConfig, userIdClaim: 'custom_user_id' };
        const customHook = new JwtAuthHook(mockJwtAuthService, customConfig, mockLogger);

        const validationResult: IJwtValidationResult = {
          valid: true,
          payload: {
            custom_user_id: 'different-user-id',
            iss: 'https://auth.example.com',
          },
        };
        mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
        mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

        const context = createMinimalContext({
          headers: { authorization: 'Bearer valid-token' },
        });

        await expect(customHook.onBeforeRequest(testItemId, testUserId, context)).rejects.toThrow(
          ForbiddenException,
        );
        await expect(customHook.onBeforeRequest(testItemId, testUserId, context)).rejects.toThrow(
          'User ID in request does not match authenticated user',
        );
      });

      it('should proceed when custom key value matches userId', async () => {
        const customConfig = { ...mockConfig, userIdClaim: 'custom_user_id' };
        const customHook = new JwtAuthHook(mockJwtAuthService, customConfig, mockLogger);

        const validationResult: IJwtValidationResult = {
          valid: true,
          payload: {
            custom_user_id: testUserId,
            iss: 'https://auth.example.com',
          },
        };
        mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
        mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

        const context = createMinimalContext({
          headers: { authorization: 'Bearer valid-token' },
        });
        const result = await customHook.onBeforeRequest(testItemId, testUserId, context);

        expect(result.proceed).toBe(true);
      });

      it('should default to sub when userIdClaim is not provided', async () => {
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
      });
    });

    describe('userIdMatchType', () => {
      describe('exact matching (default)', () => {
        it('should proceed when userId exactly matches tokenUserId', async () => {
          const validationResult: IJwtValidationResult = {
            valid: true,
            payload: {
              sub: 'user-123',
              iss: 'https://auth.example.com',
            },
          };
          mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
          mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

          const context = createMinimalContext({
            headers: { authorization: 'Bearer valid-token' },
          });
          const result = await hook.onBeforeRequest(testItemId, 'user-123', context);

          expect(result.proceed).toBe(true);
        });

        it('should throw ForbiddenException when userId does not exactly match', async () => {
          const validationResult: IJwtValidationResult = {
            valid: true,
            payload: {
              sub: 'user-123',
              iss: 'https://auth.example.com',
            },
          };
          mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
          mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

          const context = createMinimalContext({
            headers: { authorization: 'Bearer valid-token' },
          });

          await expect(hook.onBeforeRequest(testItemId, 'user-12', context)).rejects.toThrow(
            ForbiddenException,
          );
        });

        it('should use exact matching when userIdMatchType is explicitly set to exact', async () => {
          const exactConfig = { ...mockConfig, userIdMatchType: UserIdMatchType.EXACT };
          const exactHook = new JwtAuthHook(mockJwtAuthService, exactConfig, mockLogger);

          const validationResult: IJwtValidationResult = {
            valid: true,
            payload: {
              sub: 'user-123',
              iss: 'https://auth.example.com',
            },
          };
          mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
          mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

          const context = createMinimalContext({
            headers: { authorization: 'Bearer valid-token' },
          });
          const result = await exactHook.onBeforeRequest(testItemId, 'user-123', context);

          expect(result.proceed).toBe(true);
        });
      });

      describe('substring matching', () => {
        it('should proceed when tokenUserId contains userId', async () => {
          const substringConfig = { ...mockConfig, userIdMatchType: UserIdMatchType.SUBSTRING };
          const substringHook = new JwtAuthHook(mockJwtAuthService, substringConfig, mockLogger);

          const validationResult: IJwtValidationResult = {
            valid: true,
            payload: {
              sub: 'auth0|user-123',
              iss: 'https://auth.example.com',
            },
          };
          mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
          mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

          const context = createMinimalContext({
            headers: { authorization: 'Bearer valid-token' },
          });
          const result = await substringHook.onBeforeRequest(testItemId, 'user-123', context);

          expect(result.proceed).toBe(true);
        });

        it('should proceed when userId contains tokenUserId', async () => {
          const substringConfig = { ...mockConfig, userIdMatchType: UserIdMatchType.SUBSTRING };
          const substringHook = new JwtAuthHook(mockJwtAuthService, substringConfig, mockLogger);

          const validationResult: IJwtValidationResult = {
            valid: true,
            payload: {
              sub: 'user-123',
              iss: 'https://auth.example.com',
            },
          };
          mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
          mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

          const context = createMinimalContext({
            headers: { authorization: 'Bearer valid-token' },
          });
          const result = await substringHook.onBeforeRequest(
            testItemId,
            'prefix-user-123-suffix',
            context,
          );

          expect(result.proceed).toBe(true);
        });

        it('should throw ForbiddenException when neither contains the other', async () => {
          const substringConfig = { ...mockConfig, userIdMatchType: UserIdMatchType.SUBSTRING };
          const substringHook = new JwtAuthHook(mockJwtAuthService, substringConfig, mockLogger);

          const validationResult: IJwtValidationResult = {
            valid: true,
            payload: {
              sub: 'auth0|user-123',
              iss: 'https://auth.example.com',
            },
          };
          mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
          mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

          const context = createMinimalContext({
            headers: { authorization: 'Bearer valid-token' },
          });

          await expect(
            substringHook.onBeforeRequest(testItemId, 'different-user', context),
          ).rejects.toThrow(ForbiddenException);
        });
      });

      describe('regex matching', () => {
        it('should extract userId from capture group and compare against URL userId', async () => {
          const regexConfig = {
            ...mockConfig,
            userIdMatchType: UserIdMatchType.REGEX,
            userIdMatchRegex: '^(.+)@clients$',
          };
          const regexHook = new JwtAuthHook(mockJwtAuthService, regexConfig, mockLogger);

          const validationResult: IJwtValidationResult = {
            valid: true,
            payload: {
              sub: 'FfXHGud25MDOUGjQyBZnCWkkWlFDCS0Y@clients',
              iss: 'https://auth.example.com',
            },
          };
          mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
          mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

          const context = createMinimalContext({
            headers: { authorization: 'Bearer valid-token' },
          });
          const result = await regexHook.onBeforeRequest(
            testItemId,
            'FfXHGud25MDOUGjQyBZnCWkkWlFDCS0Y',
            context,
          );

          expect(result.proceed).toBe(true);
        });

        it('should throw ForbiddenException when extracted userId does not match URL userId', async () => {
          const regexConfig = {
            ...mockConfig,
            userIdMatchType: UserIdMatchType.REGEX,
            userIdMatchRegex: '^(.+)@clients$',
          };
          const regexHook = new JwtAuthHook(mockJwtAuthService, regexConfig, mockLogger);

          const validationResult: IJwtValidationResult = {
            valid: true,
            payload: {
              sub: 'FfXHGud25MDOUGjQyBZnCWkkWlFDCS0Y@clients',
              iss: 'https://auth.example.com',
            },
          };
          mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
          mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

          const context = createMinimalContext({
            headers: { authorization: 'Bearer valid-token' },
          });

          await expect(
            regexHook.onBeforeRequest(testItemId, 'different-user-id', context),
          ).rejects.toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException when tokenUserId does not match the regex pattern', async () => {
          const regexConfig = {
            ...mockConfig,
            userIdMatchType: UserIdMatchType.REGEX,
            userIdMatchRegex: '^(.+)@clients$',
          };
          const regexHook = new JwtAuthHook(mockJwtAuthService, regexConfig, mockLogger);

          const validationResult: IJwtValidationResult = {
            valid: true,
            payload: {
              sub: 'user-without-suffix',
              iss: 'https://auth.example.com',
            },
          };
          mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
          mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

          const context = createMinimalContext({
            headers: { authorization: 'Bearer valid-token' },
          });

          await expect(
            regexHook.onBeforeRequest(testItemId, 'user-without-suffix', context),
          ).rejects.toThrow(ForbiddenException);
        });

        it('should use full match when regex has no capture group', async () => {
          const regexConfig = {
            ...mockConfig,
            userIdMatchType: UserIdMatchType.REGEX,
            userIdMatchRegex: '^user-\\d+$',
          };
          const regexHook = new JwtAuthHook(mockJwtAuthService, regexConfig, mockLogger);

          const validationResult: IJwtValidationResult = {
            valid: true,
            payload: {
              sub: 'user-123',
              iss: 'https://auth.example.com',
            },
          };
          mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
          mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

          const context = createMinimalContext({
            headers: { authorization: 'Bearer valid-token' },
          });
          const result = await regexHook.onBeforeRequest(testItemId, 'user-123', context);

          expect(result.proceed).toBe(true);
        });

        it('should throw ForbiddenException when full match does not equal userId (no capture group)', async () => {
          const regexConfig = {
            ...mockConfig,
            userIdMatchType: UserIdMatchType.REGEX,
            userIdMatchRegex: '^user-\\d+$',
          };
          const regexHook = new JwtAuthHook(mockJwtAuthService, regexConfig, mockLogger);

          const validationResult: IJwtValidationResult = {
            valid: true,
            payload: {
              sub: 'user-123',
              iss: 'https://auth.example.com',
            },
          };
          mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
          mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

          const context = createMinimalContext({
            headers: { authorization: 'Bearer valid-token' },
          });

          await expect(regexHook.onBeforeRequest(testItemId, 'user-456', context)).rejects.toThrow(
            ForbiddenException,
          );
        });

        it('should extract from first capture group when multiple groups exist', async () => {
          const regexConfig = {
            ...mockConfig,
            userIdMatchType: UserIdMatchType.REGEX,
            userIdMatchRegex: '^(auth0|google)\\|(.+)$',
          };
          const regexHook = new JwtAuthHook(mockJwtAuthService, regexConfig, mockLogger);

          const validationResult: IJwtValidationResult = {
            valid: true,
            payload: {
              sub: 'auth0|user-123',
              iss: 'https://auth.example.com',
            },
          };
          mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
          mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

          const context = createMinimalContext({
            headers: { authorization: 'Bearer valid-token' },
          });
          // First capture group is 'auth0', so that's what gets compared
          const result = await regexHook.onBeforeRequest(testItemId, 'auth0', context);

          expect(result.proceed).toBe(true);
        });
      });
    });
  });

  describe('onBeforeBatchRequest', () => {
    const testItemIds = ['item-1', 'item-2', 'item-3'];

    it('should skip validation and proceed when disabled', async () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const disabledHook = new JwtAuthHook(mockJwtAuthService, disabledConfig, mockLogger);

      const context = createMinimalContext();
      const result = await disabledHook.onBeforeBatchRequest(testItemIds, testUserId, context);

      expect(result.proceed).toBe(true);
      expect(mockJwtAuthService.extractBearerToken).not.toHaveBeenCalled();
      expect(mockJwtAuthService.validateToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when no authorization header is present', async () => {
      mockJwtAuthService.extractBearerToken.mockReturnValue(null);

      const context = createMinimalContext();

      await expect(hook.onBeforeBatchRequest(testItemIds, testUserId, context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(hook.onBeforeBatchRequest(testItemIds, testUserId, context)).rejects.toThrow(
        'Missing or invalid bearer token',
      );
      expect(mockJwtAuthService.extractBearerToken).toHaveBeenCalledWith(undefined);
    });

    it('should throw UnauthorizedException when authorization header is malformed', async () => {
      mockJwtAuthService.extractBearerToken.mockReturnValue(null);

      const context = createMinimalContext({
        headers: { authorization: 'Basic abc123' },
      });

      await expect(hook.onBeforeBatchRequest(testItemIds, testUserId, context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(hook.onBeforeBatchRequest(testItemIds, testUserId, context)).rejects.toThrow(
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

      await expect(hook.onBeforeBatchRequest(testItemIds, testUserId, context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(hook.onBeforeBatchRequest(testItemIds, testUserId, context)).rejects.toThrow(
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
      const result = await hook.onBeforeBatchRequest(testItemIds, matchingUserId, context);

      expect(result.proceed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should throw UnauthorizedException when context is missing', async () => {
      mockJwtAuthService.extractBearerToken.mockReturnValue(null);

      await expect(hook.onBeforeBatchRequest(testItemIds, testUserId, undefined)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockJwtAuthService.extractBearerToken).toHaveBeenCalledWith(undefined);
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

      await expect(hook.onBeforeBatchRequest(testItemIds, testUserId, context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(hook.onBeforeBatchRequest(testItemIds, testUserId, context)).rejects.toThrow(
        'User ID in request does not match authenticated user',
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
      const result = await hook.onBeforeBatchRequest(testItemIds, testUserId, context);

      expect(result.proceed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should proceed when matchUserId is disabled even if userId does not match', async () => {
      const disabledMatchConfig = { ...mockConfig, matchUserId: false };
      const disabledMatchHook = new JwtAuthHook(
        mockJwtAuthService,
        disabledMatchConfig,
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
      const result = await disabledMatchHook.onBeforeBatchRequest(testItemIds, testUserId, context);

      expect(result.proceed).toBe(true);
    });

    it('should use custom userIdClaim when provided', async () => {
      const customConfig = { ...mockConfig, userIdClaim: 'custom_user_id' };
      const customHook = new JwtAuthHook(mockJwtAuthService, customConfig, mockLogger);

      const matchingUserId = 'user-123';
      const validationResult: IJwtValidationResult = {
        valid: true,
        payload: {
          custom_user_id: matchingUserId,
          iss: 'https://auth.example.com',
        },
      };
      mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
      mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

      const context = createMinimalContext({
        headers: { authorization: 'Bearer valid-token' },
      });
      const result = await customHook.onBeforeBatchRequest(testItemIds, matchingUserId, context);

      expect(result.proceed).toBe(true);
    });

    it('should support substring matching for userId', async () => {
      const substringConfig = { ...mockConfig, userIdMatchType: UserIdMatchType.SUBSTRING };
      const substringHook = new JwtAuthHook(mockJwtAuthService, substringConfig, mockLogger);

      const validationResult: IJwtValidationResult = {
        valid: true,
        payload: {
          sub: 'auth0|user-123',
          iss: 'https://auth.example.com',
        },
      };
      mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
      mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

      const context = createMinimalContext({
        headers: { authorization: 'Bearer valid-token' },
      });
      const result = await substringHook.onBeforeBatchRequest(testItemIds, 'user-123', context);

      expect(result.proceed).toBe(true);
    });

    it('should support regex matching with capture group extraction for userId', async () => {
      const regexConfig = {
        ...mockConfig,
        userIdMatchType: UserIdMatchType.REGEX,
        userIdMatchRegex: '^(.+)@clients$',
      };
      const regexHook = new JwtAuthHook(mockJwtAuthService, regexConfig, mockLogger);

      const validationResult: IJwtValidationResult = {
        valid: true,
        payload: {
          sub: 'user-123@clients',
          iss: 'https://auth.example.com',
        },
      };
      mockJwtAuthService.extractBearerToken.mockReturnValue('valid-token');
      mockJwtAuthService.validateToken.mockResolvedValue(validationResult);

      const context = createMinimalContext({
        headers: { authorization: 'Bearer valid-token' },
      });
      const result = await regexHook.onBeforeBatchRequest(testItemIds, 'user-123', context);

      expect(result.proceed).toBe(true);
    });
  });
});
