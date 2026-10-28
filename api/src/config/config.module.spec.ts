import 'reflect-metadata';
import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsDefined, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TransformNumber } from '@dismissible/nestjs-validation';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ConfigModule, getConfigProviders } from './config.module';

class DatabaseTestConfig {
  @IsDefined()
  @IsString()
  public readonly url!: string;
}

class ServerTestConfig {
  @IsDefined()
  @TransformNumber()
  @IsNumber()
  public readonly port!: number;
}

class TestConfig {
  @ValidateNested()
  @IsDefined()
  @Type(() => ServerTestConfig)
  public readonly server!: ServerTestConfig;

  @IsOptional()
  @ValidateNested()
  @Type(() => DatabaseTestConfig)
  public readonly database?: DatabaseTestConfig;
}

@Injectable()
class ServerConsumer {
  constructor(public readonly config: ServerTestConfig) {}
}

@Module({ providers: [ServerConsumer], exports: [ServerConsumer] })
class ConsumerModule {}

describe('ConfigModule', () => {
  let dir: string;
  const originalPort = process.env.TEST_CONFIG_PORT;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'config-module-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    if (originalPort === undefined) {
      delete process.env.TEST_CONFIG_PORT;
    } else {
      process.env.TEST_CONFIG_PORT = originalPort;
    }
  });

  describe('forRoot', () => {
    it('should provide the root config and nested config classes', async () => {
      writeFileSync(join(dir, '.env.yaml'), 'server:\n  port: 3001\n');

      const moduleRef = await Test.createTestingModule({
        imports: [ConfigModule.forRoot({ schema: TestConfig, path: dir })],
      }).compile();

      expect(moduleRef.get(TestConfig)).toBeInstanceOf(TestConfig);
      expect(moduleRef.get(ServerTestConfig).port).toBe(3001);
      expect(moduleRef.get(TestConfig).server).toBe(moduleRef.get(ServerTestConfig));
    });

    it('should make nested config classes injectable in other modules', async () => {
      writeFileSync(join(dir, '.env.yaml'), 'server:\n  port: 3001\n');

      const moduleRef = await Test.createTestingModule({
        imports: [ConfigModule.forRoot({ schema: TestConfig, path: dir }), ConsumerModule],
      }).compile();

      expect(moduleRef.get(ServerConsumer).config.port).toBe(3001);
    });

    it('should substitute environment variables by default', async () => {
      process.env.TEST_CONFIG_PORT = '8080';
      writeFileSync(join(dir, '.env.yaml'), 'server:\n  port: ${TEST_CONFIG_PORT:-3001}\n');

      const moduleRef = await Test.createTestingModule({
        imports: [ConfigModule.forRoot({ schema: TestConfig, path: dir })],
      }).compile();

      expect(moduleRef.get(ServerTestConfig).port).toBe(8080);
    });

    it('should not substitute environment variables when ignored', () => {
      writeFileSync(join(dir, '.env.yaml'), 'server:\n  port: ${TEST_CONFIG_PORT:-3001}\n');

      expect(() =>
        ConfigModule.forRoot({
          schema: TestConfig,
          path: dir,
          ignoreEnvironmentVariableSubstitution: true,
        }),
      ).toThrow('config server.port does not match the following rules');
    });

    it('should throw when the config is invalid', () => {
      writeFileSync(join(dir, '.env.yaml'), 'database:\n  url: postgres://localhost\n');

      expect(() => ConfigModule.forRoot({ schema: TestConfig, path: dir })).toThrow(
        'Configuration is not valid',
      );
    });

    it('should be a global module', () => {
      writeFileSync(join(dir, '.env.yaml'), 'server:\n  port: 3001\n');

      const result = ConfigModule.forRoot({ schema: TestConfig, path: dir });

      expect(result.module).toBe(ConfigModule);
      expect(Reflect.getMetadata('__module:global__', ConfigModule)).toBe(true);
    });
  });

  describe('getConfigProviders', () => {
    it('should not provide plain objects or arrays', () => {
      const config = Object.assign(new TestConfig(), {
        server: Object.assign(new ServerTestConfig(), { port: 1 }),
        plain: { nested: Object.assign(new DatabaseTestConfig(), { url: 'x' }) },
        list: [new DatabaseTestConfig()],
      });

      const provided = getConfigProviders(config, TestConfig).map(({ provide }) => provide);

      expect(provided).toEqual([TestConfig, ServerTestConfig, DatabaseTestConfig]);
    });
  });
});
