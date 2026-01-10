import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { join } from 'path';
import { createTestApp, cleanupTestData } from '../../src/app-test.factory';
import { NullLogger } from '@dismissible/nestjs-logger';

/**
 * Helper to make multiple requests rapidly and collect results
 */
async function makeMultipleRequests(
  app: INestApplication,
  count: number,
  options: {
    headers?: Record<string, string>;
    userId?: string;
    itemId?: string;
  } = {},
): Promise<{ statusCodes: number[]; responses: request.Response[] }> {
  const statusCodes: number[] = [];
  const responses: request.Response[] = [];
  const userId = options.userId ?? 'rate-limit-test-user';
  const itemId = options.itemId ?? 'rate-limit-test-item';

  for (let i = 0; i < count; i++) {
    let req = request(app.getHttpServer()).get(`/v1/users/${userId}/items/${itemId}`);

    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        req = req.set(key, value);
      }
    }

    const response = await req;
    statusCodes.push(response.status);
    responses.push(response);
  }

  return { statusCodes, responses };
}

/**
 * Helper to advance fake timers for rate limit window reset.
 * Uses jest.advanceTimersByTime to control time deterministically.
 */
function advanceRateLimitWindow(durationMs = 1100): void {
  jest.advanceTimersByTime(durationMs);
}

describe('Rate Limiter E2E', () => {
  describe('Rate limiter enabled (basic)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/rate-limiter-enabled'),
          logger: NullLogger,
        },
      });
      await cleanupTestData(app);
      jest.useFakeTimers();
    });

    afterAll(async () => {
      jest.useRealTimers();
      await cleanupTestData(app);
      await app.close();
    });

    beforeEach(() => {
      advanceRateLimitWindow();
    });

    it('should allow requests within rate limit', async () => {
      const { statusCodes } = await makeMultipleRequests(app, 3, {
        headers: { 'x-forwarded-for': '192.168.1.100' },
        userId: 'user-within-limit',
      });

      // All 3 requests should succeed (points = 3)
      expect(statusCodes).toEqual([200, 200, 200]);
    });

    it('should return 429 when rate limit is exceeded', async () => {
      const { statusCodes, responses } = await makeMultipleRequests(app, 5, {
        headers: { 'x-forwarded-for': '192.168.1.101' },
        userId: 'user-exceed-limit',
      });

      // First 3 should succeed, remaining should be rate limited
      expect(statusCodes.slice(0, 3)).toEqual([200, 200, 200]);
      expect(statusCodes.slice(3)).toEqual([429, 429]);

      // Verify error response contains rate limit message
      const rateLimitedResponse = responses[3];
      expect(rateLimitedResponse.body.message).toContain('Rate limit exceeded');
    });

    it('should reset rate limit after duration window', async () => {
      // Exhaust the rate limit
      await makeMultipleRequests(app, 4, {
        headers: { 'x-forwarded-for': '192.168.1.102' },
        userId: 'user-reset-test',
      });

      // Advance time for the rate limit to reset (duration = 1 second)
      advanceRateLimitWindow();

      // Should be able to make requests again
      const { statusCodes } = await makeMultipleRequests(app, 3, {
        headers: { 'x-forwarded-for': '192.168.1.102' },
        userId: 'user-reset-test-2',
      });

      expect(statusCodes).toEqual([200, 200, 200]);
    });

    it('should rate limit different IPs independently', async () => {
      // First IP makes 3 requests
      const { statusCodes: ip1Codes } = await makeMultipleRequests(app, 3, {
        headers: { 'x-forwarded-for': '10.0.0.1' },
        userId: 'user-ip-1',
      });

      // Second IP should still be able to make requests
      const { statusCodes: ip2Codes } = await makeMultipleRequests(app, 3, {
        headers: { 'x-forwarded-for': '10.0.0.2' },
        userId: 'user-ip-2',
      });

      expect(ip1Codes).toEqual([200, 200, 200]);
      expect(ip2Codes).toEqual([200, 200, 200]);
    });
  });

  describe('Rate limiter disabled', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/rate-limiter-disabled'),
          logger: NullLogger,
        },
      });
      await cleanupTestData(app);
    });

    afterAll(async () => {
      await cleanupTestData(app);
      await app.close();
    });

    it('should allow unlimited requests when rate limiter is disabled', async () => {
      const { statusCodes } = await makeMultipleRequests(app, 10, {
        headers: { 'x-forwarded-for': '192.168.1.200' },
        userId: 'user-disabled',
      });

      // All requests should succeed
      expect(statusCodes).toEqual(Array(10).fill(200));
    });
  });

  describe('Rate limiter with OR key mode', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/rate-limiter-key-mode-or'),
          logger: NullLogger,
        },
      });
      await cleanupTestData(app);
      jest.useFakeTimers();
    });

    afterAll(async () => {
      jest.useRealTimers();
      await cleanupTestData(app);
      await app.close();
    });

    beforeEach(() => {
      advanceRateLimitWindow();
    });

    it('should use IP as primary key when available (OR mode)', async () => {
      // Same IP with different origins should share rate limit
      const { statusCodes } = await makeMultipleRequests(app, 4, {
        headers: {
          'x-forwarded-for': '172.16.0.1',
          origin: 'http://example1.com',
        },
        userId: 'user-or-ip',
      });

      // First 3 succeed, 4th blocked (all counted under same IP key)
      expect(statusCodes).toEqual([200, 200, 200, 429]);
    });

    it('should fall back to origin when IP is not available (OR mode)', async () => {
      // No IP header, should use origin
      const { statusCodes } = await makeMultipleRequests(app, 4, {
        headers: { origin: 'http://fallback-origin.com' },
        userId: 'user-or-origin',
      });

      expect(statusCodes).toEqual([200, 200, 200, 429]);
    });
  });

  describe('Rate limiter with ANY key mode', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/rate-limiter-key-mode-any'),
          logger: NullLogger,
        },
      });
      await cleanupTestData(app);
      jest.useFakeTimers();
    });

    afterAll(async () => {
      jest.useRealTimers();
      await cleanupTestData(app);
      await app.close();
    });

    beforeEach(() => {
      advanceRateLimitWindow();
    });

    it('should check IP and origin independently (ANY mode)', async () => {
      // Same origin but different IPs
      // Each IP gets its own bucket, and origin gets its own bucket
      const { statusCodes: firstBatch } = await makeMultipleRequests(app, 3, {
        headers: {
          'x-forwarded-for': '192.168.50.1',
          origin: 'http://shared-origin.com',
        },
        userId: 'user-any-1',
      });

      expect(firstBatch).toEqual([200, 200, 200]);

      // Different IP but same origin - origin bucket should be exhausted
      const { statusCodes: secondBatch } = await makeMultipleRequests(app, 1, {
        headers: {
          'x-forwarded-for': '192.168.50.2',
          origin: 'http://shared-origin.com',
        },
        userId: 'user-any-2',
      });

      // Should be blocked because origin bucket is exhausted
      expect(secondBatch).toEqual([429]);
    });

    it('should allow requests when using completely different keys', async () => {
      const { statusCodes: firstBatch } = await makeMultipleRequests(app, 3, {
        headers: {
          'x-forwarded-for': '192.168.60.1',
          origin: 'http://unique-origin-1.com',
        },
        userId: 'user-any-unique-1',
      });

      advanceRateLimitWindow();

      const { statusCodes: secondBatch } = await makeMultipleRequests(app, 3, {
        headers: {
          'x-forwarded-for': '192.168.60.2',
          origin: 'http://unique-origin-2.com',
        },
        userId: 'user-any-unique-2',
      });

      expect(firstBatch).toEqual([200, 200, 200]);
      expect(secondBatch).toEqual([200, 200, 200]);
    });
  });

  describe('Rate limiter with ignored keys (whitelist)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/rate-limiter-ignored-keys'),
          logger: NullLogger,
        },
      });
      await cleanupTestData(app);
      jest.useFakeTimers();
    });

    afterAll(async () => {
      jest.useRealTimers();
      await cleanupTestData(app);
      await app.close();
    });

    beforeEach(() => {
      advanceRateLimitWindow();
    });

    it('should bypass rate limiting for whitelisted IPs', async () => {
      // 127.0.0.1 is in the ignoredKeys list
      const { statusCodes } = await makeMultipleRequests(app, 10, {
        headers: { 'x-forwarded-for': '127.0.0.1' },
        userId: 'user-whitelisted-ip',
      });

      // All requests should succeed (bypasses rate limit)
      expect(statusCodes).toEqual(Array(10).fill(200));
    });

    it('should bypass rate limiting for whitelisted origins (hostname match)', async () => {
      // whitelisted.example.com is in the ignoredKeys list
      const { statusCodes } = await makeMultipleRequests(app, 10, {
        headers: {
          'x-forwarded-for': '192.168.99.1',
          origin: 'https://whitelisted.example.com/some/path',
        },
        userId: 'user-whitelisted-origin',
      });

      // All requests should succeed (bypasses rate limit due to origin hostname)
      expect(statusCodes).toEqual(Array(10).fill(200));
    });

    it('should still rate limit non-whitelisted requests', async () => {
      // Non-whitelisted IP and origin
      const { statusCodes } = await makeMultipleRequests(app, 5, {
        headers: {
          'x-forwarded-for': '192.168.99.99',
          origin: 'http://not-whitelisted.com',
        },
        userId: 'user-not-whitelisted',
      });

      // First 3 succeed, then rate limited
      expect(statusCodes).toEqual([200, 200, 200, 429, 429]);
    });
  });

  describe('Rate limiter key types', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/rate-limiter-enabled'),
          logger: NullLogger,
        },
      });
      await cleanupTestData(app);
      jest.useFakeTimers();
    });

    afterAll(async () => {
      jest.useRealTimers();
      await cleanupTestData(app);
      await app.close();
    });

    beforeEach(() => {
      advanceRateLimitWindow();
    });

    it('should extract IP from x-forwarded-for header', async () => {
      const { statusCodes } = await makeMultipleRequests(app, 4, {
        headers: { 'x-forwarded-for': '203.0.113.1' },
        userId: 'user-xff',
      });

      expect(statusCodes).toEqual([200, 200, 200, 429]);
    });

    it('should extract IP from x-real-ip header when x-forwarded-for is not present', async () => {
      const { statusCodes } = await makeMultipleRequests(app, 4, {
        headers: { 'x-real-ip': '203.0.113.2' },
        userId: 'user-xri',
      });

      expect(statusCodes).toEqual([200, 200, 200, 429]);
    });

    it('should handle comma-separated x-forwarded-for (use first IP)', async () => {
      // x-forwarded-for can contain multiple IPs, should use the first one
      const { statusCodes } = await makeMultipleRequests(app, 4, {
        headers: { 'x-forwarded-for': '203.0.113.3, 10.0.0.1, 192.168.1.1' },
        userId: 'user-xff-multi',
      });

      expect(statusCodes).toEqual([200, 200, 200, 429]);
    });
  });
});
