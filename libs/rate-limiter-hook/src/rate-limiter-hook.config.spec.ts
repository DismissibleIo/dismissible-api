import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  RateLimiterHookConfig,
  RateLimitKeyType,
  RateLimitKeyMode,
} from './rate-limiter-hook.config';

describe('RateLimiterHookConfig', () => {
  describe('enabled property', () => {
    it('should transform boolean true to true', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: true,
        points: 10,
        duration: 1,
        keyType: ['ip'],
      });

      expect(config.enabled).toBe(true);
    });

    it('should transform boolean false to false', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: false,
      });

      expect(config.enabled).toBe(false);
    });

    it('should transform string "true" to boolean true', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: 'true',
        points: 10,
        duration: 1,
        keyType: ['ip'],
      });

      expect(config.enabled).toBe(true);
    });

    it('should transform string "false" to boolean false', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: 'false',
      });

      expect(config.enabled).toBe(false);
    });

    it('should transform string "True" (case insensitive) to boolean true', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: 'True',
        points: 10,
        duration: 1,
        keyType: ['ip'],
      });

      expect(config.enabled).toBe(true);
    });

    it('should convert non-true string values to false', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: 'other',
      });

      expect(config.enabled).toBe(false);
    });
  });

  describe('points validation', () => {
    it('should require points when enabled is true', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: true,
        duration: 1,
        keyType: ['ip'],
      });

      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'points')).toBe(true);
    });

    it('should not require points when enabled is false', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: false,
      });

      const errors = await validate(config);
      expect(errors.some((e) => e.property === 'points')).toBe(false);
    });

    it('should transform string to number', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: true,
        points: '10',
        duration: 1,
        keyType: ['ip'],
      });

      expect(config.points).toBe(10);
    });
  });

  describe('duration validation', () => {
    it('should require duration when enabled is true', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: true,
        points: 10,
        keyType: ['ip'],
      });

      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'duration')).toBe(true);
    });

    it('should not require duration when enabled is false', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: false,
      });

      const errors = await validate(config);
      expect(errors.some((e) => e.property === 'duration')).toBe(false);
    });

    it('should transform string to number', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: true,
        points: 10,
        duration: '60',
        keyType: ['ip'],
      });

      expect(config.duration).toBe(60);
    });
  });

  describe('keyType validation', () => {
    it('should require keyType when enabled is true', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: true,
        points: 10,
        duration: 1,
      });

      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'keyType')).toBe(true);
    });

    it('should not require keyType when enabled is false', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: false,
      });

      const errors = await validate(config);
      expect(errors.some((e) => e.property === 'keyType')).toBe(false);
    });

    it('should accept array of valid key types', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: true,
        points: 10,
        duration: 1,
        keyType: ['ip', 'origin'],
      });

      expect(config.keyType).toEqual(['ip', 'origin']);
      const errors = await validate(config);
      expect(errors.some((e) => e.property === 'keyType')).toBe(false);
    });

    it('should transform comma-separated string to array', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: true,
        points: 10,
        duration: 1,
        keyType: 'ip,origin,referrer',
      });

      expect(config.keyType).toEqual(['ip', 'origin', 'referrer']);
    });

    it('should trim whitespace from comma-separated values', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: true,
        points: 10,
        duration: 1,
        keyType: 'ip , origin , referrer',
      });

      expect(config.keyType).toEqual(['ip', 'origin', 'referrer']);
    });

    it('should fail validation for invalid enum value', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: true,
        points: 10,
        duration: 1,
        keyType: ['invalid'],
      });

      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'keyType')).toBe(true);
    });

    it('should accept "ip" as a valid value', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: true,
        points: 10,
        duration: 1,
        keyType: ['ip'],
      });

      expect(config.keyType).toContain(RateLimitKeyType.IP);
      const errors = await validate(config);
      expect(errors.some((e) => e.property === 'keyType')).toBe(false);
    });

    it('should accept "origin" as a valid value', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: true,
        points: 10,
        duration: 1,
        keyType: ['origin'],
      });

      expect(config.keyType).toContain(RateLimitKeyType.ORIGIN);
      const errors = await validate(config);
      expect(errors.some((e) => e.property === 'keyType')).toBe(false);
    });

    it('should accept "referrer" as a valid value', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: true,
        points: 10,
        duration: 1,
        keyType: ['referrer'],
      });

      expect(config.keyType).toContain(RateLimitKeyType.REFERRER);
      const errors = await validate(config);
      expect(errors.some((e) => e.property === 'keyType')).toBe(false);
    });
  });

  describe('optional properties', () => {
    describe('blockDuration property', () => {
      it('should accept optional blockDuration', async () => {
        const config = plainToInstance(RateLimiterHookConfig, {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: ['ip'],
          blockDuration: 60,
        });

        expect(config.blockDuration).toBe(60);
      });

      it('should transform string to number', async () => {
        const config = plainToInstance(RateLimiterHookConfig, {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: ['ip'],
          blockDuration: '120',
        });

        expect(config.blockDuration).toBe(120);
      });

      it('should pass validation when blockDuration is not provided', async () => {
        const config = plainToInstance(RateLimiterHookConfig, {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: ['ip'],
        });

        const errors = await validate(config);
        expect(errors.some((e) => e.property === 'blockDuration')).toBe(false);
      });
    });

    describe('priority property', () => {
      it('should accept optional priority', async () => {
        const config = plainToInstance(RateLimiterHookConfig, {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: ['ip'],
          priority: -50,
        });

        expect(config.priority).toBe(-50);
      });

      it('should transform string to number', async () => {
        const config = plainToInstance(RateLimiterHookConfig, {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: ['ip'],
          priority: '-100',
        });

        expect(config.priority).toBe(-100);
      });

      it('should pass validation when priority is not provided', async () => {
        const config = plainToInstance(RateLimiterHookConfig, {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: ['ip'],
        });

        const errors = await validate(config);
        expect(errors.some((e) => e.property === 'priority')).toBe(false);
      });
    });

    describe('keyMode property', () => {
      it('should accept "and" as a valid value', async () => {
        const config = plainToInstance(RateLimiterHookConfig, {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: ['ip'],
          keyMode: 'and',
        });

        expect(config.keyMode).toBe(RateLimitKeyMode.AND);
        const errors = await validate(config);
        expect(errors.some((e) => e.property === 'keyMode')).toBe(false);
      });

      it('should accept "or" as a valid value', async () => {
        const config = plainToInstance(RateLimiterHookConfig, {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: ['ip'],
          keyMode: 'or',
        });

        expect(config.keyMode).toBe(RateLimitKeyMode.OR);
        const errors = await validate(config);
        expect(errors.some((e) => e.property === 'keyMode')).toBe(false);
      });

      it('should accept "any" as a valid value', async () => {
        const config = plainToInstance(RateLimiterHookConfig, {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: ['ip'],
          keyMode: 'any',
        });

        expect(config.keyMode).toBe(RateLimitKeyMode.ANY);
        const errors = await validate(config);
        expect(errors.some((e) => e.property === 'keyMode')).toBe(false);
      });

      it('should fail validation for invalid keyMode value', async () => {
        const config = plainToInstance(RateLimiterHookConfig, {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: ['ip'],
          keyMode: 'invalid',
        });

        const errors = await validate(config);
        expect(errors.some((e) => e.property === 'keyMode')).toBe(true);
      });

      it('should pass validation when keyMode is not provided', async () => {
        const config = plainToInstance(RateLimiterHookConfig, {
          enabled: true,
          points: 10,
          duration: 1,
          keyType: ['ip'],
        });

        const errors = await validate(config);
        expect(errors.some((e) => e.property === 'keyMode')).toBe(false);
      });
    });
  });

  describe('full configuration validation', () => {
    it('should pass validation with all required fields when enabled', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: true,
        points: 10,
        duration: 1,
        keyType: ['ip'],
      });

      const errors = await validate(config);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with only enabled=false', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: false,
      });

      const errors = await validate(config);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with all optional fields', async () => {
      const config = plainToInstance(RateLimiterHookConfig, {
        enabled: true,
        points: 100,
        duration: 60,
        keyType: ['ip', 'origin'],
        keyMode: 'or',
        blockDuration: 300,
        priority: -25,
      });

      const errors = await validate(config);
      expect(errors.length).toBe(0);
    });
  });
});
