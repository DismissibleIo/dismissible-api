import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CacheConfig, CacheType } from './cache.config';
import { RedisCacheConfig } from '@dismissible/nestjs-redis-cache';
import { MemoryCacheConfig } from '@dismissible/nestjs-memory-cache';

describe('CacheConfig', () => {
  describe('transformation', () => {
    it('should transform cache type correctly for redis', () => {
      const config = plainToInstance(CacheConfig, {
        type: 'redis',
      });

      expect(config.type).toBe(CacheType.REDIS);
    });

    it('should transform cache type correctly for memory', () => {
      const config = plainToInstance(CacheConfig, {
        type: 'memory',
      });

      expect(config.type).toBe(CacheType.MEMORY);
    });

    it('should include redis config when type is redis', () => {
      const config = plainToInstance(CacheConfig, {
        type: CacheType.REDIS,
        redis: { url: 'redis://localhost:6379' },
      });

      expect(config.redis).toBeInstanceOf(RedisCacheConfig);
      expect(config.redis?.url).toBe('redis://localhost:6379');
    });

    it('should include memory config when type is memory', () => {
      const config = plainToInstance(CacheConfig, {
        type: CacheType.MEMORY,
        memory: { maxItems: 100 },
      });

      expect(config.memory).toBeInstanceOf(MemoryCacheConfig);
      expect(config.memory?.maxItems).toBe(100);
    });

    it('should handle config without type', () => {
      const config = plainToInstance(CacheConfig, {});

      expect(config.type).toBeUndefined();
    });

    it('should transform empty string type to undefined', () => {
      const config = plainToInstance(CacheConfig, {
        type: '',
      });

      expect(config.type).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should pass validation with valid redis config', async () => {
      const config = plainToInstance(CacheConfig, {
        type: CacheType.REDIS,
        redis: { url: 'redis://localhost:6379' },
      });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid redis config with all optional fields', async () => {
      const config = plainToInstance(CacheConfig, {
        type: CacheType.REDIS,
        redis: {
          url: 'redis://localhost:6379',
          keyPrefix: 'test:',
          ttlMs: 3600000,
          enableReadyCheck: true,
          maxRetriesPerRequest: 3,
        },
      });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid memory config', async () => {
      const config = plainToInstance(CacheConfig, {
        type: CacheType.MEMORY,
        memory: { maxItems: 100 },
      });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid memory config with all optional fields', async () => {
      const config = plainToInstance(CacheConfig, {
        type: CacheType.MEMORY,
        memory: {
          maxItems: 100,
          ttlMs: 3600000,
        },
      });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when type is not provided', async () => {
      const config = plainToInstance(CacheConfig, {});
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when type is empty string', async () => {
      const config = plainToInstance(CacheConfig, {
        type: '',
      });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when type is invalid', async () => {
      const config = plainToInstance(CacheConfig, {
        type: 'invalid-type',
      });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      const typeError = errors.find((e) => e.property === 'type');
      expect(typeError).toBeDefined();
    });

    it('should fail validation when redis url is missing', async () => {
      const config = plainToInstance(CacheConfig, {
        type: CacheType.REDIS,
        redis: {},
      });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      const redisError = errors.find((e) => e.property === 'redis');
      expect(redisError).toBeDefined();
    });

    it('should fail validation when redis url is invalid', async () => {
      const config = plainToInstance(CacheConfig, {
        type: CacheType.REDIS,
        redis: { url: 123 },
      });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      const redisError = errors.find((e) => e.property === 'redis');
      expect(redisError).toBeDefined();
    });

    it('should fail validation when redis ttlMs is invalid', async () => {
      const config = plainToInstance(CacheConfig, {
        type: CacheType.REDIS,
        redis: { url: 'redis://localhost:6379', ttlMs: 'not-a-number' },
      });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      const redisError = errors.find((e) => e.property === 'redis');
      expect(redisError).toBeDefined();
    });

    it('should fail validation when memory maxItems is invalid', async () => {
      const config = plainToInstance(CacheConfig, {
        type: CacheType.MEMORY,
        memory: { maxItems: 'not-a-number' },
      });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      const memoryError = errors.find((e) => e.property === 'memory');
      expect(memoryError).toBeDefined();
    });

    it('should fail validation when memory ttlMs is invalid', async () => {
      const config = plainToInstance(CacheConfig, {
        type: CacheType.MEMORY,
        memory: { ttlMs: 'not-a-number' },
      });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      const memoryError = errors.find((e) => e.property === 'memory');
      expect(memoryError).toBeDefined();
    });

    it('should not validate redis config when type is memory', async () => {
      const config = plainToInstance(CacheConfig, {
        type: CacheType.MEMORY,
        redis: {}, // Invalid redis config, but should be ignored
        memory: { maxItems: 100 },
      });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should not validate memory config when type is redis', async () => {
      const config = plainToInstance(CacheConfig, {
        type: CacheType.REDIS,
        redis: { url: 'redis://localhost:6379' },
        memory: {}, // Invalid memory config, but should be ignored
      });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });
  });
});
