import { mock, Mock } from 'ts-jest-mocker';
import { RateLimiterService } from './rate-limiter.service';
import {
  RateLimiterHookConfig,
  RateLimitKeyType,
  RateLimitKeyMode,
} from './rate-limiter-hook.config';
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

describe('RateLimiterService', () => {
  let service: RateLimiterService;
  let mockLogger: Mock<IDismissibleLogger>;
  let mockConfig: RateLimiterHookConfig;

  beforeEach(() => {
    mockLogger = mock<IDismissibleLogger>({ failIfMockNotProvided: false });
    mockConfig = {
      enabled: true,
      points: 10,
      duration: 1,
      keyType: [RateLimitKeyType.IP],
    };

    service = new RateLimiterService(mockConfig, mockLogger);
  });

  describe('generateKey', () => {
    describe('IP key type', () => {
      it('should extract IP from x-forwarded-for header', () => {
        const context = createMinimalContext({
          headers: { 'x-forwarded-for': '192.168.1.100' },
        });

        const key = service.generateKey(context);
        expect(key).toBe('192.168.1.100');
      });

      it('should extract first IP from comma-separated x-forwarded-for', () => {
        const context = createMinimalContext({
          headers: { 'x-forwarded-for': '192.168.1.100, 10.0.0.1, 172.16.0.1' },
        });

        const key = service.generateKey(context);
        expect(key).toBe('192.168.1.100');
      });

      it('should fall back to x-real-ip when x-forwarded-for is not present', () => {
        const context = createMinimalContext({
          headers: { 'x-real-ip': '10.0.0.50' },
        });

        const key = service.generateKey(context);
        expect(key).toBe('10.0.0.50');
      });

      it('should return "unknown" when no IP headers are present', () => {
        const context = createMinimalContext();

        const key = service.generateKey(context);
        expect(key).toBe('unknown');
      });
    });

    describe('Origin key type', () => {
      beforeEach(() => {
        mockConfig = {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: [RateLimitKeyType.ORIGIN],
        };
        service = new RateLimiterService(mockConfig, mockLogger);
      });

      it('should extract origin from headers', () => {
        const context = createMinimalContext({
          headers: { origin: 'https://example.com' },
        });

        const key = service.generateKey(context);
        expect(key).toBe('https://example.com');
      });

      it('should return "unknown" when origin is not present', () => {
        const context = createMinimalContext();

        const key = service.generateKey(context);
        expect(key).toBe('unknown');
      });
    });

    describe('Referrer key type', () => {
      beforeEach(() => {
        mockConfig = {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: [RateLimitKeyType.REFERRER],
        };
        service = new RateLimiterService(mockConfig, mockLogger);
      });

      it('should extract referer from headers', () => {
        const context = createMinimalContext({
          headers: { referer: 'https://referrer.example.com/page' },
        });

        const key = service.generateKey(context);
        expect(key).toBe('https://referrer.example.com/page');
      });

      it('should return "unknown" when referer is not present', () => {
        const context = createMinimalContext();

        const key = service.generateKey(context);
        expect(key).toBe('unknown');
      });
    });

    describe('Combined key types', () => {
      beforeEach(() => {
        mockConfig = {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: [RateLimitKeyType.IP, RateLimitKeyType.ORIGIN],
        };
        service = new RateLimiterService(mockConfig, mockLogger);
      });

      it('should combine IP and origin with colon separator', () => {
        const context = createMinimalContext({
          headers: {
            'x-forwarded-for': '192.168.1.100',
            origin: 'https://example.com',
          },
        });

        const key = service.generateKey(context);
        expect(key).toBe('192.168.1.100:https://example.com');
      });

      it('should only include parts that are present', () => {
        const context = createMinimalContext({
          headers: { 'x-forwarded-for': '192.168.1.100' },
        });

        const key = service.generateKey(context);
        expect(key).toBe('192.168.1.100');
      });

      it('should combine all three key types', () => {
        mockConfig = {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: [RateLimitKeyType.IP, RateLimitKeyType.ORIGIN, RateLimitKeyType.REFERRER],
        };
        service = new RateLimiterService(mockConfig, mockLogger);

        const context = createMinimalContext({
          headers: {
            'x-forwarded-for': '192.168.1.100',
            origin: 'https://example.com',
            referer: 'https://referrer.com/page',
          },
        });

        const key = service.generateKey(context);
        expect(key).toBe('192.168.1.100:https://example.com:https://referrer.com/page');
      });
    });

    describe('Edge cases', () => {
      it('should return "unknown" when context is undefined', () => {
        const key = service.generateKey(undefined);
        expect(key).toBe('unknown');
      });

      it('should return "unknown" when context headers is undefined', () => {
        const context = { ...createMinimalContext(), headers: undefined } as any;
        const key = service.generateKey(context);
        expect(key).toBe('unknown');
      });
    });
  });

  describe('generateKeys', () => {
    describe('AND mode (default)', () => {
      it('should return single combined key by default', () => {
        const context = createMinimalContext({
          headers: {
            'x-forwarded-for': '192.168.1.100',
            origin: 'https://example.com',
          },
        });

        mockConfig = {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: [RateLimitKeyType.IP, RateLimitKeyType.ORIGIN],
        };
        service = new RateLimiterService(mockConfig, mockLogger);

        const keys = service.generateKeys(context);
        expect(keys).toEqual(['192.168.1.100:https://example.com']);
      });

      it('should return single combined key with explicit AND mode', () => {
        const context = createMinimalContext({
          headers: {
            'x-forwarded-for': '192.168.1.100',
            origin: 'https://example.com',
          },
        });

        mockConfig = {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: [RateLimitKeyType.IP, RateLimitKeyType.ORIGIN],
          keyMode: RateLimitKeyMode.AND,
        };
        service = new RateLimiterService(mockConfig, mockLogger);

        const keys = service.generateKeys(context);
        expect(keys).toEqual(['192.168.1.100:https://example.com']);
      });
    });

    describe('OR mode', () => {
      beforeEach(() => {
        mockConfig = {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: [RateLimitKeyType.IP, RateLimitKeyType.ORIGIN, RateLimitKeyType.REFERRER],
          keyMode: RateLimitKeyMode.OR,
        };
        service = new RateLimiterService(mockConfig, mockLogger);
      });

      it('should return first available key type (IP)', () => {
        const context = createMinimalContext({
          headers: {
            'x-forwarded-for': '192.168.1.100',
            origin: 'https://example.com',
            referer: 'https://referrer.com',
          },
        });

        const keys = service.generateKeys(context);
        expect(keys).toEqual(['192.168.1.100']);
      });

      it('should fall back to origin when IP is not available', () => {
        const context = createMinimalContext({
          headers: {
            origin: 'https://example.com',
            referer: 'https://referrer.com',
          },
        });

        const keys = service.generateKeys(context);
        expect(keys).toEqual(['https://example.com']);
      });

      it('should fall back to referrer when IP and origin are not available', () => {
        const context = createMinimalContext({
          headers: {
            referer: 'https://referrer.com',
          },
        });

        const keys = service.generateKeys(context);
        expect(keys).toEqual(['https://referrer.com']);
      });

      it('should return "unknown" when no key types are available', () => {
        const context = createMinimalContext();

        const keys = service.generateKeys(context);
        expect(keys).toEqual(['unknown']);
      });
    });

    describe('ANY mode', () => {
      beforeEach(() => {
        mockConfig = {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: [RateLimitKeyType.IP, RateLimitKeyType.ORIGIN],
          keyMode: RateLimitKeyMode.ANY,
        };
        service = new RateLimiterService(mockConfig, mockLogger);
      });

      it('should return all available keys with type prefixes', () => {
        const context = createMinimalContext({
          headers: {
            'x-forwarded-for': '192.168.1.100',
            origin: 'https://example.com',
          },
        });

        const keys = service.generateKeys(context);
        expect(keys).toEqual(['ip:192.168.1.100', 'origin:https://example.com']);
      });

      it('should only return keys for available types', () => {
        const context = createMinimalContext({
          headers: {
            'x-forwarded-for': '192.168.1.100',
          },
        });

        const keys = service.generateKeys(context);
        expect(keys).toEqual(['ip:192.168.1.100']);
      });

      it('should return "unknown" when no key types are available', () => {
        const context = createMinimalContext();

        const keys = service.generateKeys(context);
        expect(keys).toEqual(['unknown']);
      });

      it('should include all three key types when available', () => {
        mockConfig = {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: [RateLimitKeyType.IP, RateLimitKeyType.ORIGIN, RateLimitKeyType.REFERRER],
          keyMode: RateLimitKeyMode.ANY,
        };
        service = new RateLimiterService(mockConfig, mockLogger);

        const context = createMinimalContext({
          headers: {
            'x-forwarded-for': '192.168.1.100',
            origin: 'https://example.com',
            referer: 'https://referrer.com',
          },
        });

        const keys = service.generateKeys(context);
        expect(keys).toEqual([
          'ip:192.168.1.100',
          'origin:https://example.com',
          'referrer:https://referrer.com',
        ]);
      });
    });
  });

  describe('consume', () => {
    it('should allow request when under rate limit', async () => {
      const result = await service.consume('test-key');

      expect(result.allowed).toBe(true);
      expect(result.remainingPoints).toBeDefined();
      expect(result.msBeforeNext).toBeDefined();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Rate limiter: Request allowed',
        expect.objectContaining({
          key: 'test-key',
        }),
      );
    });

    it('should block request when rate limit is exceeded', async () => {
      // Exhaust the rate limit
      for (let i = 0; i < mockConfig.points; i++) {
        await service.consume('exhausted-key');
      }

      // This request should be blocked
      const result = await service.consume('exhausted-key');

      expect(result.allowed).toBe(false);
      expect(result.error).toBe('Too many requests');
      expect(result.msBeforeNext).toBeDefined();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Rate limiter: Request blocked',
        expect.objectContaining({
          key: 'exhausted-key',
        }),
      );
    });

    it('should track remaining points correctly', async () => {
      const result1 = await service.consume('points-test');
      expect(result1.remainingPoints).toBe(mockConfig.points - 1);

      const result2 = await service.consume('points-test');
      expect(result2.remainingPoints).toBe(mockConfig.points - 2);
    });

    it('should rate limit keys independently', async () => {
      // Exhaust rate limit for key1
      for (let i = 0; i < mockConfig.points; i++) {
        await service.consume('key1');
      }

      // key1 should be blocked
      const result1 = await service.consume('key1');
      expect(result1.allowed).toBe(false);

      // key2 should still be allowed
      const result2 = await service.consume('key2');
      expect(result2.allowed).toBe(true);
    });
  });

  describe('consumeAll', () => {
    it('should allow request when all keys are within rate limit', async () => {
      const result = await service.consumeAll(['key1', 'key2', 'key3']);

      expect(result.allowed).toBe(true);
      expect(result.remainingPoints).toBeDefined();
    });

    it('should return minimum remaining points across all keys', async () => {
      // Consume some points on key1
      await service.consume('key1');
      await service.consume('key1');
      await service.consume('key1');

      // Consume one point on key2
      await service.consume('key2');

      // key1 has 7 remaining, key2 has 9 remaining
      const result = await service.consumeAll(['key1', 'key2']);

      expect(result.allowed).toBe(true);
      // After consumeAll: key1 has 6, key2 has 8 - minimum is 6
      expect(result.remainingPoints).toBe(6);
    });

    it('should block request when any key exceeds rate limit', async () => {
      // Exhaust rate limit for key1
      for (let i = 0; i < mockConfig.points; i++) {
        await service.consume('key1');
      }

      // This should be blocked because key1 is exhausted
      const result = await service.consumeAll(['key1', 'key2']);

      expect(result.allowed).toBe(false);
      expect(result.error).toBe('Too many requests');
    });

    it('should handle single key array', async () => {
      const result = await service.consumeAll(['single-key']);

      expect(result.allowed).toBe(true);
      expect(result.remainingPoints).toBe(mockConfig.points - 1);
    });

    it('should handle empty msBeforeNext in results', async () => {
      const result = await service.consumeAll(['test-key']);

      expect(result.allowed).toBe(true);
    });
  });

  describe('blockDuration configuration', () => {
    it('should create service with blockDuration', () => {
      const configWithBlock: RateLimiterHookConfig = {
        ...mockConfig,
        blockDuration: 60,
      };
      const serviceWithBlock = new RateLimiterService(configWithBlock, mockLogger);

      expect(serviceWithBlock).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle unknown key type gracefully', () => {
      // Force an invalid key type to test the default case
      const configWithInvalidKeyType = {
        ...mockConfig,
        keyType: ['unknown' as RateLimitKeyType],
      };
      const serviceWithInvalidType = new RateLimiterService(configWithInvalidKeyType, mockLogger);

      const context = createMinimalContext({
        headers: { 'x-forwarded-for': '192.168.1.100' },
      });

      const key = serviceWithInvalidType.generateKey(context);
      expect(key).toBe('unknown');
    });

    it('should handle unexpected errors in consume and allow request', async () => {
      // We need to mock the internal rateLimiter to throw an unexpected error
      const unexpectedError = new TypeError('Unexpected type error');
      const rateLimiterMock = (service as any).rateLimiter;
      jest.spyOn(rateLimiterMock, 'consume').mockRejectedValue(unexpectedError);

      const result = await service.consume('test-key');

      expect(result.allowed).toBe(true);
      expect(result.error).toBe('Rate limiter error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Rate limiter: Unexpected error',
        unexpectedError,
        { key: 'test-key' },
      );
    });

    it('should handle non-Error unexpected errors in consume', async () => {
      // Test when the thrown value is not an Error instance
      const rateLimiterMock = (service as any).rateLimiter;
      jest.spyOn(rateLimiterMock, 'consume').mockRejectedValue('String error');

      const result = await service.consume('test-key');

      expect(result.allowed).toBe(true);
      expect(result.error).toBe('Rate limiter error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Rate limiter: Unexpected error',
        expect.any(Error),
        { key: 'test-key' },
      );
    });

    it('should handle x-forwarded-for with empty first IP and return unknown', () => {
      const context = createMinimalContext({
        headers: { 'x-forwarded-for': ', 10.0.0.1' },
      });

      const key = service.generateKey(context);
      // Empty first IP (after trim) is falsy, so falls through without returning
      // No x-real-ip fallback, so returns undefined from extractIp
      // which results in "unknown" key
      expect(key).toBe('unknown');
    });
  });

  describe('extractRawKeyValues', () => {
    it('should extract all configured key values', () => {
      mockConfig = {
        enabled: true,
        points: 10,
        duration: 1,
        keyType: [RateLimitKeyType.IP, RateLimitKeyType.ORIGIN, RateLimitKeyType.REFERRER],
      };
      service = new RateLimiterService(mockConfig, mockLogger);

      const context = createMinimalContext({
        headers: {
          'x-forwarded-for': '192.168.1.100',
          origin: 'https://example.com',
          referer: 'https://referrer.com/page',
        },
      });

      const values = service.extractRawKeyValues(context);
      expect(values).toEqual(['192.168.1.100', 'https://example.com', 'https://referrer.com/page']);
    });

    it('should only return values that are present', () => {
      mockConfig = {
        enabled: true,
        points: 10,
        duration: 1,
        keyType: [RateLimitKeyType.IP, RateLimitKeyType.ORIGIN],
      };
      service = new RateLimiterService(mockConfig, mockLogger);

      const context = createMinimalContext({
        headers: { 'x-forwarded-for': '192.168.1.100' },
      });

      const values = service.extractRawKeyValues(context);
      expect(values).toEqual(['192.168.1.100']);
    });

    it('should return empty array when no values are present', () => {
      const context = createMinimalContext();
      const values = service.extractRawKeyValues(context);
      expect(values).toEqual([]);
    });
  });

  describe('isIgnored', () => {
    describe('when ignoredKeys is not configured', () => {
      it('should return false', () => {
        const context = createMinimalContext({
          headers: { 'x-forwarded-for': '192.168.1.100' },
        });

        expect(service.isIgnored(context)).toBe(false);
      });
    });

    describe('when ignoredKeys is empty array', () => {
      beforeEach(() => {
        mockConfig = {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: [RateLimitKeyType.IP],
          ignoredKeys: [],
        };
        service = new RateLimiterService(mockConfig, mockLogger);
      });

      it('should return false', () => {
        const context = createMinimalContext({
          headers: { 'x-forwarded-for': '192.168.1.100' },
        });

        expect(service.isIgnored(context)).toBe(false);
      });
    });

    describe('when ignoredKeys is configured', () => {
      beforeEach(() => {
        mockConfig = {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: [RateLimitKeyType.IP, RateLimitKeyType.ORIGIN, RateLimitKeyType.REFERRER],
          ignoredKeys: ['google.com', '192.168.8.1', 'trusted-service.internal'],
        };
        service = new RateLimiterService(mockConfig, mockLogger);
      });

      it('should return true when IP matches exactly', () => {
        const context = createMinimalContext({
          headers: { 'x-forwarded-for': '192.168.8.1' },
        });

        expect(service.isIgnored(context)).toBe(true);
        expect(mockLogger.debug).toHaveBeenCalledWith('Rate limiter: Key ignored (exact)', {
          rawValue: '192.168.8.1',
          matchedValue: '192.168.8.1',
        });
      });

      it('should return true when origin contains ignored domain', () => {
        const context = createMinimalContext({
          headers: { origin: 'https://google.com' },
        });

        expect(service.isIgnored(context)).toBe(true);
      });

      it('should return true when referer contains ignored domain', () => {
        const context = createMinimalContext({
          headers: { referer: 'https://google.com/search?q=test' },
        });

        expect(service.isIgnored(context)).toBe(true);
      });

      it('should return false when no values match ignored keys', () => {
        const context = createMinimalContext({
          headers: {
            'x-forwarded-for': '10.0.0.1',
            origin: 'https://example.com',
            referer: 'https://example.com/page',
          },
        });

        expect(service.isIgnored(context)).toBe(false);
      });

      it('should return true when any key value matches', () => {
        const context = createMinimalContext({
          headers: {
            'x-forwarded-for': '10.0.0.1', // does not match
            origin: 'https://google.com', // matches
          },
        });

        expect(service.isIgnored(context)).toBe(true);
      });

      it('should match internal service hostname', () => {
        const context = createMinimalContext({
          headers: { origin: 'http://trusted-service.internal:8080' },
        });

        expect(service.isIgnored(context)).toBe(true);
      });

      it('should return false when context is undefined', () => {
        expect(service.isIgnored(undefined)).toBe(false);
      });

      it('should return false when no key values can be extracted', () => {
        const context = createMinimalContext();
        expect(service.isIgnored(context)).toBe(false);
      });
    });
  });
});
