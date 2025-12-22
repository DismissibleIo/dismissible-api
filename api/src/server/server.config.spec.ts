import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ServerConfig } from './server.config';

describe('ServerConfig', () => {
  describe('port', () => {
    it('should transform string to number', () => {
      const config = plainToInstance(ServerConfig, { port: '3001' });
      expect(config.port).toBe(3001);
    });

    it('should keep number unchanged', () => {
      const config = plainToInstance(ServerConfig, { port: 3001 });
      expect(config.port).toBe(3001);
    });

    it('should handle different port numbers', () => {
      const config = plainToInstance(ServerConfig, { port: '8080' });
      expect(config.port).toBe(8080);
    });
  });

  describe('validation', () => {
    it('should pass validation with valid port number', async () => {
      const config = plainToInstance(ServerConfig, { port: 3001 });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with string port that transforms to number', async () => {
      const config = plainToInstance(ServerConfig, { port: '3001' });
      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when port is missing', async () => {
      const config = plainToInstance(ServerConfig, {});
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('port');
    });

    it('should fail validation when port is not a number', async () => {
      const config = plainToInstance(ServerConfig, { port: 'not-a-number' });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('port');
    });

    it('should fail validation when port is null', async () => {
      const config = plainToInstance(ServerConfig, { port: null });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('port');
    });

    it('should fail validation when port is undefined', async () => {
      const config = plainToInstance(ServerConfig, { port: undefined });
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('port');
    });
  });
});
