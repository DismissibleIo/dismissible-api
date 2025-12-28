import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AppConfig } from './app.config';
import { SwaggerConfig } from '../swagger/swagger.config';
import { PostgresStorageConfig } from '@dismissible/nestjs-postgres-storage';
import { JwtAuthHookConfig } from '@dismissible/nestjs-jwt-auth-hook';

describe('AppConfig', () => {
  describe('transformation', () => {
    it('should transform all nested configs correctly', () => {
      const config = plainToInstance(AppConfig, {
        server: { port: 3001 },
        cors: { enabled: true },
        helmet: { enabled: true },
        swagger: { enabled: true },
        db: { connectionString: 'postgresql://localhost:5432/test' },
        jwtAuth: {
          enabled: true,
          wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
        },
      });

      expect(config.swagger).toBeInstanceOf(SwaggerConfig);
      expect(config.swagger.enabled).toBe(true);
      expect(config.db).toBeInstanceOf(PostgresStorageConfig);
      expect(config.db.connectionString).toBe('postgresql://localhost:5432/test');
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
        cors: { enabled: true },
        helmet: { enabled: true },
        swagger: { enabled: true },
        db: { connectionString: 'postgresql://localhost:5432/test' },
        jwtAuth: {
          enabled: true,
          wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
        },
      });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when swagger config has invalid nested property', async () => {
      const config = plainToInstance(AppConfig, {
        server: { port: 3001 },
        cors: { enabled: true },
        helmet: { enabled: true },
        swagger: { enabled: true, path: 123 },
        db: { connectionString: 'postgresql://localhost:5432/test' },
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

    it('should fail validation when db config is invalid', async () => {
      const config = plainToInstance(AppConfig, {
        server: { port: 3001 },
        cors: { enabled: true },
        helmet: { enabled: true },
        swagger: { enabled: true },
        db: { connectionString: 123 },
        jwtAuth: {
          enabled: true,
          wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
        },
      });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      const dbError = errors.find((e) => e.property === 'db');
      expect(dbError).toBeDefined();
    });

    it('should fail validation when jwtAuth config is invalid', async () => {
      const config = plainToInstance(AppConfig, {
        server: { port: 3001 },
        cors: { enabled: true },
        helmet: { enabled: true },
        swagger: { enabled: true },
        db: { connectionString: 'postgresql://localhost:5432/test' },
        jwtAuth: { enabled: true, wellKnownUrl: 'not-a-valid-url' },
      });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      const jwtAuthError = errors.find((e) => e.property === 'jwtAuth');
      expect(jwtAuthError).toBeDefined();
    });

    it('should fail validation when jwtAuth enabled is false but wellKnownUrl is required', async () => {
      const config = plainToInstance(AppConfig, {
        server: { port: 3001 },
        cors: { enabled: true },
        helmet: { enabled: true },
        swagger: { enabled: true },
        db: { connectionString: 'postgresql://localhost:5432/test' },
        jwtAuth: { enabled: false },
      });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });
  });
});
