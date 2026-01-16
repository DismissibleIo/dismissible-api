import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AppConfig } from './app.config';
import { SwaggerConfig } from '../swagger/swagger.config';
import { JwtAuthHookConfig } from '@dismissible/nestjs-jwt-auth-hook';

describe('AppConfig', () => {
  describe('transformation', () => {
    it('should transform all nested configs correctly', () => {
      const config = plainToInstance(AppConfig, {
        server: { port: 3001 },
        cors: { enabled: true, origins: ['http://localhost:3000'] },
        helmet: { enabled: true },
        swagger: { enabled: true },
        storage: {
          type: 'postgres',
          postgres: { connectionString: 'postgresql://localhost:5432/test' },
        },
        jwtAuth: {
          enabled: true,
          wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
        },
      });

      expect(config.swagger).toBeInstanceOf(SwaggerConfig);
      expect(config.swagger.enabled).toBe(true);
      expect(config.jwtAuth).toBeInstanceOf(JwtAuthHookConfig);
      expect(config.jwtAuth.enabled).toBe(true);
      expect(config.jwtAuth.wellKnownUrl).toBe(
        'https://auth.example.com/.well-known/openid-configuration',
      );
    });
  });

  describe('validation', () => {
    it('should pass validation with all required nested configs', async () => {
      const config = plainToInstance(AppConfig, {
        server: { port: 3001 },
        cors: { enabled: true, origins: ['http://localhost:3000'] },
        helmet: { enabled: true },
        swagger: { enabled: true },
        storage: {
          type: 'postgres',
          postgres: { connectionString: 'postgresql://localhost:5432/test' },
        },
        jwtAuth: {
          enabled: true,
          wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
        },
        validation: {},
      });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when swagger config has invalid nested property', async () => {
      const config = plainToInstance(AppConfig, {
        server: { port: 3001 },
        cors: { enabled: true, origins: ['http://localhost:3000'] },
        helmet: { enabled: true },
        swagger: { enabled: true, path: 123 },
        storage: {
          type: 'postgres',
          postgres: { connectionString: 'postgresql://localhost:5432/test' },
        },
        jwtAuth: {
          enabled: true,
          wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
        },
      });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      const swaggerError = errors.find((e) => e.property === 'swagger');
      expect(swaggerError).toBeDefined();
    });

    it('should fail validation when jwtAuth config is invalid', async () => {
      const config = plainToInstance(AppConfig, {
        server: { port: 3001 },
        cors: { enabled: true, origins: ['http://localhost:3000'] },
        helmet: { enabled: true },
        swagger: { enabled: true },
        storage: {
          type: 'postgres',
          postgres: { connectionString: 'postgresql://localhost:5432/test' },
        },
        jwtAuth: { enabled: true, wellKnownUrl: 'not-a-valid-url' },
      });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      const jwtAuthError = errors.find((e) => e.property === 'jwtAuth');
      expect(jwtAuthError).toBeDefined();
    });
  });
});
