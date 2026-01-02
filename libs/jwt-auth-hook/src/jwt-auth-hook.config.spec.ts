import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { JwtAuthHookConfig } from './jwt-auth-hook.config';

describe('JwtAuthHookConfig', () => {
  describe('enabled property', () => {
    it('should transform boolean true to true', async () => {
      const config = plainToInstance(JwtAuthHookConfig, {
        enabled: true,
        wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
      });

      expect(config.enabled).toBe(true);
    });

    it('should transform boolean false to false', async () => {
      const config = plainToInstance(JwtAuthHookConfig, {
        enabled: false,
        wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
      });

      expect(config.enabled).toBe(false);
    });

    it('should transform string "true" to boolean true', async () => {
      const config = plainToInstance(JwtAuthHookConfig, {
        enabled: 'true',
        wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
      });

      expect(config.enabled).toBe(true);
    });

    it('should transform string "false" to boolean false', async () => {
      const config = plainToInstance(JwtAuthHookConfig, {
        enabled: 'false',
        wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
      });

      expect(config.enabled).toBe(false);
    });

    it('should transform string "True" (case insensitive) to boolean true', async () => {
      const config = plainToInstance(JwtAuthHookConfig, {
        enabled: 'True',
        wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
      });

      expect(config.enabled).toBe(true);
    });

    it('should convert non-true string values to false', async () => {
      const config = plainToInstance(JwtAuthHookConfig, {
        enabled: 'other',
        wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
      });

      expect(config.enabled).toBe(false);
    });
  });

  describe('wellKnownUrl validation', () => {
    it('should require wellKnownUrl when enabled is true', async () => {
      const config = plainToInstance(JwtAuthHookConfig, {
        enabled: true,
      });

      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'wellKnownUrl')).toBe(true);
    });

    it('should not require wellKnownUrl when enabled is false', async () => {
      const config = plainToInstance(JwtAuthHookConfig, {
        enabled: false,
      });

      const errors = await validate(config);
      expect(errors.some((e) => e.property === 'wellKnownUrl')).toBe(false);
    });

    it('should validate wellKnownUrl is a valid URL', async () => {
      const config = plainToInstance(JwtAuthHookConfig, {
        enabled: true,
        wellKnownUrl: 'not-a-valid-url',
      });

      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'wellKnownUrl')).toBe(true);
    });
  });

  describe('optional properties', () => {
    describe('issuer property', () => {
      it('should accept optional issuer as array', async () => {
        const config = plainToInstance(JwtAuthHookConfig, {
          enabled: true,
          wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
          issuer: ['https://auth.example.com'],
        });

        expect(config.issuer).toEqual(['https://auth.example.com']);
      });

      it('should transform comma-separated string to array', async () => {
        const config = plainToInstance(JwtAuthHookConfig, {
          enabled: true,
          wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
          issuer: 'https://auth.example.com,https://auth2.example.com,https://auth3.example.com',
        });

        expect(config.issuer).toEqual([
          'https://auth.example.com',
          'https://auth2.example.com',
          'https://auth3.example.com',
        ]);
      });

      it('should trim whitespace from comma-separated values', async () => {
        const config = plainToInstance(JwtAuthHookConfig, {
          enabled: true,
          wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
          issuer:
            'https://auth.example.com , https://auth2.example.com , https://auth3.example.com',
        });

        expect(config.issuer).toEqual([
          'https://auth.example.com',
          'https://auth2.example.com',
          'https://auth3.example.com',
        ]);
      });

      it('should accept multiple issuers as array', async () => {
        const config = plainToInstance(JwtAuthHookConfig, {
          enabled: true,
          wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
          issuer: ['https://auth.example.com', 'https://auth2.example.com'],
        });

        expect(config.issuer).toEqual(['https://auth.example.com', 'https://auth2.example.com']);
      });

      it('should validate issuer array contains only strings', async () => {
        const config = plainToInstance(JwtAuthHookConfig, {
          enabled: true,
          wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
          issuer: ['https://auth.example.com', 123],
        });

        const errors = await validate(config);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'issuer')).toBe(true);
      });
    });

    it('should accept optional audience', async () => {
      const config = plainToInstance(JwtAuthHookConfig, {
        enabled: true,
        wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
        audience: 'my-api',
      });

      expect(config.audience).toBe('my-api');
    });

    describe('algorithms property', () => {
      it('should accept optional algorithms as array', async () => {
        const config = plainToInstance(JwtAuthHookConfig, {
          enabled: true,
          wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
          algorithms: ['RS256'],
        });

        expect(config.algorithms).toEqual(['RS256']);
      });

      it('should transform comma-separated string to array', async () => {
        const config = plainToInstance(JwtAuthHookConfig, {
          enabled: true,
          wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
          algorithms: 'RS256,RS384,RS512',
        });

        expect(config.algorithms).toEqual(['RS256', 'RS384', 'RS512']);
      });

      it('should trim whitespace from comma-separated values', async () => {
        const config = plainToInstance(JwtAuthHookConfig, {
          enabled: true,
          wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
          algorithms: 'RS256 , RS384 , RS512',
        });

        expect(config.algorithms).toEqual(['RS256', 'RS384', 'RS512']);
      });

      it('should accept multiple algorithms as array', async () => {
        const config = plainToInstance(JwtAuthHookConfig, {
          enabled: true,
          wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
          algorithms: ['RS256', 'RS384'],
        });

        expect(config.algorithms).toEqual(['RS256', 'RS384']);
      });

      it('should validate algorithms array contains only strings', async () => {
        const config = plainToInstance(JwtAuthHookConfig, {
          enabled: true,
          wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
          algorithms: ['RS256', 123],
        });

        const errors = await validate(config);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'algorithms')).toBe(true);
      });
    });

    it('should transform jwksCacheDuration to number', async () => {
      const config = plainToInstance(JwtAuthHookConfig, {
        enabled: true,
        wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
        jwksCacheDuration: '600000',
      });

      expect(config.jwksCacheDuration).toBe(600000);
    });

    it('should transform requestTimeout to number', async () => {
      const config = plainToInstance(JwtAuthHookConfig, {
        enabled: true,
        wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
        requestTimeout: '30000',
      });

      expect(config.requestTimeout).toBe(30000);
    });

    it('should transform priority to number', async () => {
      const config = plainToInstance(JwtAuthHookConfig, {
        enabled: true,
        wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
        priority: '-100',
      });

      expect(config.priority).toBe(-100);
    });
  });
});
