import { mock, Mock } from 'ts-jest-mocker';
import { RateLimiterHook, TooManyRequestsException } from './rate-limiter.hook';
import { RateLimiterService, IRateLimitResult } from './rate-limiter.service';
import { RateLimiterHookConfig, RateLimitKeyType } from './rate-limiter-hook.config';
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

describe('RateLimiterHook', () => {
  let hook: RateLimiterHook;
  let mockRateLimiterService: Mock<RateLimiterService>;
  let mockLogger: Mock<IDismissibleLogger>;
  let mockConfig: RateLimiterHookConfig;

  const testItemId = 'test-item-id';
  const testUserId = 'test-user-id';

  beforeEach(() => {
    mockRateLimiterService = mock(RateLimiterService, { failIfMockNotProvided: false });
    mockLogger = mock<IDismissibleLogger>({ failIfMockNotProvided: false });
    mockConfig = {
      enabled: true,
      points: 10,
      duration: 1,
      keyType: [RateLimitKeyType.IP],
    };

    hook = new RateLimiterHook(mockRateLimiterService, mockConfig, mockLogger);
  });

  describe('priority', () => {
    it('should default to -101 priority', () => {
      expect(hook.priority).toBe(-101);
    });

    it('should use custom priority when provided', () => {
      const customConfig = { ...mockConfig, priority: -25 };
      const customHook = new RateLimiterHook(mockRateLimiterService, customConfig, mockLogger);
      expect(customHook.priority).toBe(-25);
    });
  });

  describe('onBeforeRequest', () => {
    it('should skip rate limiting and proceed when disabled', async () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const disabledHook = new RateLimiterHook(mockRateLimiterService, disabledConfig, mockLogger);

      const context = createMinimalContext();
      const result = await disabledHook.onBeforeRequest(testItemId, testUserId, context);

      expect(result.proceed).toBe(true);
      expect(mockRateLimiterService.isIgnored).not.toHaveBeenCalled();
      expect(mockRateLimiterService.generateKeys).not.toHaveBeenCalled();
      expect(mockRateLimiterService.consumeAll).not.toHaveBeenCalled();
    });

    it('should skip rate limiting when key is ignored', async () => {
      mockRateLimiterService.isIgnored.mockReturnValue(true);

      const context = createMinimalContext({
        headers: { origin: 'https://google.com' },
      });
      const result = await hook.onBeforeRequest(testItemId, testUserId, context);

      expect(result.proceed).toBe(true);
      expect(mockRateLimiterService.isIgnored).toHaveBeenCalledWith(context);
      expect(mockRateLimiterService.generateKeys).not.toHaveBeenCalled();
      expect(mockRateLimiterService.consumeAll).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Rate limit bypassed (ignored key)',
        expect.objectContaining({
          itemId: testItemId,
          userId: testUserId,
        }),
      );
    });

    it('should proceed when request is within rate limit', async () => {
      const allowedResult: IRateLimitResult = {
        allowed: true,
        remainingPoints: 9,
        msBeforeNext: 1000,
      };
      mockRateLimiterService.isIgnored.mockReturnValue(false);
      mockRateLimiterService.generateKeys.mockReturnValue(['192.168.1.100']);
      mockRateLimiterService.consumeAll.mockResolvedValue(allowedResult);

      const context = createMinimalContext({
        headers: { 'x-forwarded-for': '192.168.1.100' },
      });
      const result = await hook.onBeforeRequest(testItemId, testUserId, context);

      expect(result.proceed).toBe(true);
      expect(mockRateLimiterService.generateKeys).toHaveBeenCalledWith(context);
      expect(mockRateLimiterService.consumeAll).toHaveBeenCalledWith(['192.168.1.100']);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Request allowed',
        expect.objectContaining({
          itemId: testItemId,
          userId: testUserId,
          keys: ['192.168.1.100'],
          remainingPoints: 9,
        }),
      );
    });

    it('should throw TooManyRequestsException when rate limit is exceeded', async () => {
      const blockedResult: IRateLimitResult = {
        allowed: false,
        remainingPoints: 0,
        msBeforeNext: 5000,
        error: 'Too many requests',
      };
      mockRateLimiterService.isIgnored.mockReturnValue(false);
      mockRateLimiterService.generateKeys.mockReturnValue(['192.168.1.100']);
      mockRateLimiterService.consumeAll.mockResolvedValue(blockedResult);

      const context = createMinimalContext({
        headers: { 'x-forwarded-for': '192.168.1.100' },
      });

      await expect(hook.onBeforeRequest(testItemId, testUserId, context)).rejects.toThrow(
        TooManyRequestsException,
      );
      await expect(hook.onBeforeRequest(testItemId, testUserId, context)).rejects.toThrow(
        'Rate limit exceeded. Please try again later.',
      );

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Rate limit exceeded',
        expect.objectContaining({
          itemId: testItemId,
          userId: testUserId,
          keys: ['192.168.1.100'],
          msBeforeNext: 5000,
        }),
      );
    });

    it('should log debug message when checking rate limit', async () => {
      const allowedResult: IRateLimitResult = {
        allowed: true,
        remainingPoints: 9,
        msBeforeNext: 1000,
      };
      mockRateLimiterService.isIgnored.mockReturnValue(false);
      mockRateLimiterService.generateKeys.mockReturnValue(['test-key']);
      mockRateLimiterService.consumeAll.mockResolvedValue(allowedResult);

      const context = createMinimalContext();
      await hook.onBeforeRequest(testItemId, testUserId, context);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Checking rate limit',
        expect.objectContaining({
          itemId: testItemId,
          userId: testUserId,
          keys: ['test-key'],
          requestId: 'req-123',
        }),
      );
    });

    it('should handle undefined context', async () => {
      const allowedResult: IRateLimitResult = {
        allowed: true,
        remainingPoints: 9,
        msBeforeNext: 1000,
      };
      mockRateLimiterService.isIgnored.mockReturnValue(false);
      mockRateLimiterService.generateKeys.mockReturnValue(['unknown']);
      mockRateLimiterService.consumeAll.mockResolvedValue(allowedResult);

      const result = await hook.onBeforeRequest(testItemId, testUserId, undefined);

      expect(result.proceed).toBe(true);
      expect(mockRateLimiterService.generateKeys).toHaveBeenCalledWith(undefined);
    });

    it('should handle multiple keys in ANY mode', async () => {
      const allowedResult: IRateLimitResult = {
        allowed: true,
        remainingPoints: 8,
        msBeforeNext: 1000,
      };
      mockRateLimiterService.isIgnored.mockReturnValue(false);
      mockRateLimiterService.generateKeys.mockReturnValue([
        'ip:192.168.1.100',
        'origin:https://example.com',
      ]);
      mockRateLimiterService.consumeAll.mockResolvedValue(allowedResult);

      const context = createMinimalContext({
        headers: {
          'x-forwarded-for': '192.168.1.100',
          origin: 'https://example.com',
        },
      });
      const result = await hook.onBeforeRequest(testItemId, testUserId, context);

      expect(result.proceed).toBe(true);
      expect(mockRateLimiterService.consumeAll).toHaveBeenCalledWith([
        'ip:192.168.1.100',
        'origin:https://example.com',
      ]);
    });
  });

  describe('TooManyRequestsException', () => {
    it('should have correct statusCode', () => {
      const exception = new TooManyRequestsException('Test message');
      expect(exception.statusCode).toBe(429);
    });

    it('should have correct name', () => {
      const exception = new TooManyRequestsException('Test message');
      expect(exception.name).toBe('TooManyRequestsException');
    });

    it('should calculate retryAfter in seconds from milliseconds', () => {
      const exception = new TooManyRequestsException('Test message', 5000);
      expect(exception.retryAfter).toBe(5);
    });

    it('should round up retryAfter to nearest second', () => {
      const exception = new TooManyRequestsException('Test message', 5500);
      expect(exception.retryAfter).toBe(6);
    });

    it('should not set retryAfter when msBeforeNext is not provided', () => {
      const exception = new TooManyRequestsException('Test message');
      expect(exception.retryAfter).toBeUndefined();
    });

    it('should include retryAfter from service result', async () => {
      const blockedResult: IRateLimitResult = {
        allowed: false,
        remainingPoints: 0,
        msBeforeNext: 3000,
        error: 'Too many requests',
      };
      mockRateLimiterService.isIgnored.mockReturnValue(false);
      mockRateLimiterService.generateKeys.mockReturnValue(['test-key']);
      mockRateLimiterService.consumeAll.mockResolvedValue(blockedResult);

      const context = createMinimalContext();

      try {
        await hook.onBeforeRequest(testItemId, testUserId, context);
        fail('Should have thrown TooManyRequestsException');
      } catch (error) {
        expect(error).toBeInstanceOf(TooManyRequestsException);
        expect((error as TooManyRequestsException).retryAfter).toBe(3);
      }
    });
  });
});
