import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DefaultAppConfig } from './default-app.config';
import { ServerConfig } from '../server/server.config';
import { CorsConfig } from '../cors/cors.config';
import { HelmetConfig } from '../helmet/helmet.config';
import { ValidationConfig } from '../validation/validation.config';

describe('DefaultAppConfig', () => {
  describe('transformation', () => {
    it('should transform all nested configs correctly', () => {
      const config = plainToInstance(DefaultAppConfig, {
        server: { port: 3001 },
        cors: { enabled: true, origins: ['http://localhost:3000'] },
        helmet: { enabled: true },
        validation: { disableErrorMessages: true },
      });

      expect(config.server).toBeInstanceOf(ServerConfig);
      expect(config.server.port).toBe(3001);
      expect(config.cors).toBeInstanceOf(CorsConfig);
      expect(config.cors.enabled).toBe(true);
      expect(config.helmet).toBeInstanceOf(HelmetConfig);
      expect(config.helmet.enabled).toBe(true);
      expect(config.validation).toBeInstanceOf(ValidationConfig);
      expect(config.validation.disableErrorMessages).toBe(true);
    });
  });

  describe('validation', () => {
    it('should pass validation with all required nested configs', async () => {
      const config = plainToInstance(DefaultAppConfig, {
        server: { port: 3001 },
        cors: { enabled: true, origins: ['http://localhost:3000'] },
        helmet: { enabled: true },
        validation: { disableErrorMessages: true },
      });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when server config is invalid', async () => {
      const config = plainToInstance(DefaultAppConfig, {
        server: { port: 'not-a-number' },
        cors: { enabled: true, origins: ['http://localhost:3000'] },
        helmet: { enabled: true },
        validation: { disableErrorMessages: true },
      });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      const serverError = errors.find((e) => e.property === 'server');
      expect(serverError).toBeDefined();
    });

    it('should fail validation when cors config has invalid nested property', async () => {
      const config = plainToInstance(DefaultAppConfig, {
        server: { port: 3001 },
        cors: { enabled: true, origins: ['http://localhost:3000'], maxAge: 'not-a-number' },
        helmet: { enabled: true },
        validation: { disableErrorMessages: true },
      });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      const corsError = errors.find((e) => e.property === 'cors');
      expect(corsError).toBeDefined();
    });

    it('should fail validation when helmet config has invalid nested property', async () => {
      const config = plainToInstance(DefaultAppConfig, {
        server: { port: 3001 },
        cors: { enabled: true, origins: ['http://localhost:3000'] },
        helmet: { enabled: true, hstsMaxAge: 'not-a-number' },
        validation: { disableErrorMessages: true },
      });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      const helmetError = errors.find((e) => e.property === 'helmet');
      expect(helmetError).toBeDefined();
    });
  });
});
