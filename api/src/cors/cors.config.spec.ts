import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CorsConfig } from './cors.config';

describe('CorsConfig', () => {
  describe('enabled', () => {
    it('should transform string "true" to boolean true', () => {
      const config = plainToInstance(CorsConfig, { enabled: 'true' });
      expect(config.enabled).toBe(true);
    });

    it('should transform string "false" to boolean false', () => {
      const config = plainToInstance(CorsConfig, { enabled: 'false' });
      expect(config.enabled).toBe(false);
    });

    it('should keep boolean true as true', () => {
      const config = plainToInstance(CorsConfig, { enabled: true });
      expect(config.enabled).toBe(true);
    });

    it('should keep boolean false as false', () => {
      const config = plainToInstance(CorsConfig, { enabled: false });
      expect(config.enabled).toBe(false);
    });
  });

  describe('origins', () => {
    it('should transform comma-separated string to array', () => {
      const config = plainToInstance(CorsConfig, {
        enabled: true,
        origins: 'http://localhost:3000,http://localhost:4000',
      });
      expect(config.origins).toEqual(['http://localhost:3000', 'http://localhost:4000']);
    });

    it('should trim whitespace from origins', () => {
      const config = plainToInstance(CorsConfig, {
        enabled: true,
        origins: 'http://localhost:3000 , http://localhost:4000 ',
      });
      expect(config.origins).toEqual(['http://localhost:3000', 'http://localhost:4000']);
    });

    it('should handle single origin string', () => {
      const config = plainToInstance(CorsConfig, {
        enabled: true,
        origins: 'http://localhost:3000',
      });
      expect(config.origins).toEqual(['http://localhost:3000']);
    });

    it('should keep array as array', () => {
      const config = plainToInstance(CorsConfig, {
        enabled: true,
        origins: ['http://localhost:3000', 'http://localhost:4000'],
      });
      expect(config.origins).toEqual(['http://localhost:3000', 'http://localhost:4000']);
    });
  });

  describe('methods', () => {
    it('should transform comma-separated string to array', () => {
      const config = plainToInstance(CorsConfig, {
        enabled: true,
        methods: 'GET,POST,DELETE',
      });
      expect(config.methods).toEqual(['GET', 'POST', 'DELETE']);
    });

    it('should trim whitespace from methods', () => {
      const config = plainToInstance(CorsConfig, {
        enabled: true,
        methods: 'GET , POST , DELETE',
      });
      expect(config.methods).toEqual(['GET', 'POST', 'DELETE']);
    });
  });

  describe('allowedHeaders', () => {
    it('should transform comma-separated string to array', () => {
      const config = plainToInstance(CorsConfig, {
        enabled: true,
        allowedHeaders: 'Content-Type,Authorization,x-request-id',
      });
      expect(config.allowedHeaders).toEqual(['Content-Type', 'Authorization', 'x-request-id']);
    });

    it('should trim whitespace from headers', () => {
      const config = plainToInstance(CorsConfig, {
        enabled: true,
        allowedHeaders: 'Content-Type , Authorization , x-request-id',
      });
      expect(config.allowedHeaders).toEqual(['Content-Type', 'Authorization', 'x-request-id']);
    });
  });

  describe('credentials', () => {
    it('should transform string "true" to boolean true', () => {
      const config = plainToInstance(CorsConfig, { enabled: true, credentials: 'true' });
      expect(config.credentials).toBe(true);
    });

    it('should transform string "false" to boolean false', () => {
      const config = plainToInstance(CorsConfig, { enabled: true, credentials: 'false' });
      expect(config.credentials).toBe(false);
    });

    it('should keep boolean values unchanged', () => {
      const configTrue = plainToInstance(CorsConfig, { enabled: true, credentials: true });
      const configFalse = plainToInstance(CorsConfig, { enabled: true, credentials: false });
      expect(configTrue.credentials).toBe(true);
      expect(configFalse.credentials).toBe(false);
    });
  });

  describe('maxAge', () => {
    it('should transform string to number', () => {
      const config = plainToInstance(CorsConfig, { enabled: true, maxAge: '86400' });
      expect(config.maxAge).toBe(86400);
    });

    it('should keep number unchanged', () => {
      const config = plainToInstance(CorsConfig, { enabled: true, maxAge: 3600 });
      expect(config.maxAge).toBe(3600);
    });
  });

  describe('validation', () => {
    it('should pass validation with valid config', async () => {
      const config = plainToInstance(CorsConfig, {
        enabled: true,
        origins: ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        credentials: true,
        maxAge: 86400,
      });

      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only required fields when enabled', async () => {
      const config = plainToInstance(CorsConfig, {
        enabled: true,
        origins: ['http://localhost:3000'],
      });

      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when disabled without origins', async () => {
      const config = plainToInstance(CorsConfig, {
        enabled: false,
      });

      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when enabled without origins', async () => {
      const config = plainToInstance(CorsConfig, {
        enabled: true,
      });

      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('origins');
    });

    it('should fail validation when enabled with empty origins', async () => {
      const config = plainToInstance(CorsConfig, {
        enabled: true,
        origins: [],
      });

      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('origins');
      expect(errors[0].constraints?.arrayNotEmpty).toBeDefined();
    });

    it('should fail validation when enabled is missing', async () => {
      const config = plainToInstance(CorsConfig, {});

      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('enabled');
    });
  });
});
