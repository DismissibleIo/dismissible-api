import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SwaggerConfig } from './swagger.config';

describe('SwaggerConfig', () => {
  describe('enabled', () => {
    it('should transform string "true" to boolean true', () => {
      const config = plainToInstance(SwaggerConfig, { enabled: 'true' });
      expect(config.enabled).toBe(true);
    });

    it('should transform string "false" to boolean false', () => {
      const config = plainToInstance(SwaggerConfig, { enabled: 'false' });
      expect(config.enabled).toBe(false);
    });

    it('should keep boolean true as true', () => {
      const config = plainToInstance(SwaggerConfig, { enabled: true });
      expect(config.enabled).toBe(true);
    });

    it('should keep boolean false as false', () => {
      const config = plainToInstance(SwaggerConfig, { enabled: false });
      expect(config.enabled).toBe(false);
    });

    it('should transform other string values to false', () => {
      const config = plainToInstance(SwaggerConfig, { enabled: 'yes' });
      expect(config.enabled).toBe(false);
    });

    it('should handle case-insensitive "true"', () => {
      const config = plainToInstance(SwaggerConfig, { enabled: 'TRUE' });
      expect(config.enabled).toBe(true);
    });

    it('should handle case-insensitive "True"', () => {
      const config = plainToInstance(SwaggerConfig, { enabled: 'True' });
      expect(config.enabled).toBe(true);
    });
  });

  describe('path', () => {
    it('should accept string path', () => {
      const config = plainToInstance(SwaggerConfig, {
        enabled: true,
        path: 'api-docs',
      });
      expect(config.path).toBe('api-docs');
    });

    it('should allow path to be optional', () => {
      const config = plainToInstance(SwaggerConfig, { enabled: true });
      expect(config.path).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should pass validation with valid config', async () => {
      const config = plainToInstance(SwaggerConfig, {
        enabled: true,
        path: 'docs',
      });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only required fields', async () => {
      const config = plainToInstance(SwaggerConfig, { enabled: true });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when enabled is transformed from string', async () => {
      const config = plainToInstance(SwaggerConfig, { enabled: 'true' });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when enabled is missing', async () => {
      const config = plainToInstance(SwaggerConfig, {});
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('enabled');
    });

    it('should fail validation when enabled is null', async () => {
      const config = plainToInstance(SwaggerConfig, { enabled: null });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('enabled');
    });

    it('should fail validation when enabled is undefined', async () => {
      const config = plainToInstance(SwaggerConfig, { enabled: undefined });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('enabled');
    });

    it('should fail validation when path is not a string', async () => {
      const config = plainToInstance(SwaggerConfig, {
        enabled: true,
        path: 123,
      });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      const pathError = errors.find((e) => e.property === 'path');
      expect(pathError).toBeDefined();
    });
  });
});
