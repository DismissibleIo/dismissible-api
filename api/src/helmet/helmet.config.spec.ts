import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { HelmetConfig } from './helmet.config';

describe('HelmetConfig', () => {
  describe('enabled', () => {
    it('should transform string "true" to boolean true', () => {
      const config = plainToInstance(HelmetConfig, { enabled: 'true' });
      expect(config.enabled).toBe(true);
    });

    it('should transform string "false" to boolean false', () => {
      const config = plainToInstance(HelmetConfig, { enabled: 'false' });
      expect(config.enabled).toBe(false);
    });

    it('should keep boolean true as true', () => {
      const config = plainToInstance(HelmetConfig, { enabled: true });
      expect(config.enabled).toBe(true);
    });

    it('should keep boolean false as false', () => {
      const config = plainToInstance(HelmetConfig, { enabled: false });
      expect(config.enabled).toBe(false);
    });
  });

  describe('contentSecurityPolicy', () => {
    it('should transform string "true" to boolean true', () => {
      const config = plainToInstance(HelmetConfig, {
        enabled: true,
        contentSecurityPolicy: 'true',
      });
      expect(config.contentSecurityPolicy).toBe(true);
    });

    it('should transform string "false" to boolean false', () => {
      const config = plainToInstance(HelmetConfig, {
        enabled: true,
        contentSecurityPolicy: 'false',
      });
      expect(config.contentSecurityPolicy).toBe(false);
    });

    it('should keep boolean values unchanged', () => {
      const configTrue = plainToInstance(HelmetConfig, {
        enabled: true,
        contentSecurityPolicy: true,
      });
      const configFalse = plainToInstance(HelmetConfig, {
        enabled: true,
        contentSecurityPolicy: false,
      });
      expect(configTrue.contentSecurityPolicy).toBe(true);
      expect(configFalse.contentSecurityPolicy).toBe(false);
    });
  });

  describe('crossOriginEmbedderPolicy', () => {
    it('should transform string "true" to boolean true', () => {
      const config = plainToInstance(HelmetConfig, {
        enabled: true,
        crossOriginEmbedderPolicy: 'true',
      });
      expect(config.crossOriginEmbedderPolicy).toBe(true);
    });

    it('should transform string "false" to boolean false', () => {
      const config = plainToInstance(HelmetConfig, {
        enabled: true,
        crossOriginEmbedderPolicy: 'false',
      });
      expect(config.crossOriginEmbedderPolicy).toBe(false);
    });

    it('should keep boolean values unchanged', () => {
      const configTrue = plainToInstance(HelmetConfig, {
        enabled: true,
        crossOriginEmbedderPolicy: true,
      });
      const configFalse = plainToInstance(HelmetConfig, {
        enabled: true,
        crossOriginEmbedderPolicy: false,
      });
      expect(configTrue.crossOriginEmbedderPolicy).toBe(true);
      expect(configFalse.crossOriginEmbedderPolicy).toBe(false);
    });
  });

  describe('hstsMaxAge', () => {
    it('should transform string to number', () => {
      const config = plainToInstance(HelmetConfig, { enabled: true, hstsMaxAge: '31536000' });
      expect(config.hstsMaxAge).toBe(31536000);
    });

    it('should keep number unchanged', () => {
      const config = plainToInstance(HelmetConfig, { enabled: true, hstsMaxAge: 86400 });
      expect(config.hstsMaxAge).toBe(86400);
    });
  });

  describe('hstsIncludeSubDomains', () => {
    it('should transform string "true" to boolean true', () => {
      const config = plainToInstance(HelmetConfig, {
        enabled: true,
        hstsIncludeSubDomains: 'true',
      });
      expect(config.hstsIncludeSubDomains).toBe(true);
    });

    it('should transform string "false" to boolean false', () => {
      const config = plainToInstance(HelmetConfig, {
        enabled: true,
        hstsIncludeSubDomains: 'false',
      });
      expect(config.hstsIncludeSubDomains).toBe(false);
    });

    it('should keep boolean values unchanged', () => {
      const configTrue = plainToInstance(HelmetConfig, {
        enabled: true,
        hstsIncludeSubDomains: true,
      });
      const configFalse = plainToInstance(HelmetConfig, {
        enabled: true,
        hstsIncludeSubDomains: false,
      });
      expect(configTrue.hstsIncludeSubDomains).toBe(true);
      expect(configFalse.hstsIncludeSubDomains).toBe(false);
    });
  });

  describe('hstsPreload', () => {
    it('should transform string "true" to boolean true', () => {
      const config = plainToInstance(HelmetConfig, {
        enabled: true,
        hstsPreload: 'true',
      });
      expect(config.hstsPreload).toBe(true);
    });

    it('should transform string "false" to boolean false', () => {
      const config = plainToInstance(HelmetConfig, {
        enabled: true,
        hstsPreload: 'false',
      });
      expect(config.hstsPreload).toBe(false);
    });

    it('should keep boolean values unchanged', () => {
      const configTrue = plainToInstance(HelmetConfig, {
        enabled: true,
        hstsPreload: true,
      });
      const configFalse = plainToInstance(HelmetConfig, {
        enabled: true,
        hstsPreload: false,
      });
      expect(configTrue.hstsPreload).toBe(true);
      expect(configFalse.hstsPreload).toBe(false);
    });
  });

  describe('validation', () => {
    it('should pass validation with valid config', async () => {
      const config = plainToInstance(HelmetConfig, {
        enabled: true,
        contentSecurityPolicy: true,
        crossOriginEmbedderPolicy: true,
        hstsMaxAge: 31536000,
        hstsIncludeSubDomains: true,
        hstsPreload: false,
      });

      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only required fields', async () => {
      const config = plainToInstance(HelmetConfig, {
        enabled: true,
      });

      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when enabled is missing', async () => {
      const config = plainToInstance(HelmetConfig, {});

      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('enabled');
    });
  });
});
