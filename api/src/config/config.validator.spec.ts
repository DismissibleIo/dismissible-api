import 'reflect-metadata';
import { IsBoolean, IsDefined, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TransformNumber } from '@dismissible/nestjs-validation';
import { validateConfig } from './config.validator';

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
  @IsBoolean()
  public readonly enabled: boolean = true;
}

describe('validateConfig', () => {
  it('should return an instance of the schema with nested class instances', () => {
    const config = validateConfig(TestConfig, { server: { port: '3001' } });

    expect(config).toBeInstanceOf(TestConfig);
    expect(config.server).toBeInstanceOf(ServerTestConfig);
    expect(config.server.port).toBe(3001);
  });

  it('should keep default values when the property is not provided', () => {
    const config = validateConfig(TestConfig, { server: { port: 3001 } });

    expect(config.enabled).toBe(true);
  });

  it('should strip properties that are not in the schema', () => {
    const config = validateConfig(TestConfig, { server: { port: 3001, unknown: 'x' }, other: 1 });

    expect(config).not.toHaveProperty('other');
    expect(config.server).not.toHaveProperty('unknown');
  });

  it('should throw listing each invalid property by its config path', () => {
    expect(() => validateConfig(TestConfig, { server: { port: 'abc' }, enabled: 'yes' })).toThrow(
      [
        'Configuration is not valid:',
        '  - config server.port does not match the following rules:',
        '    - isNumber: port must be a number conforming to the specified constraints, current config is `null`',
        '  - config enabled does not match the following rules:',
        '    - isBoolean: enabled must be a boolean value, current config is `"yes"`',
        '',
      ].join('\n'),
    );
  });

  it('should throw when a required nested config is missing', () => {
    expect(() => validateConfig(TestConfig, {})).toThrow(
      '  - config server does not match the following rules:',
    );
  });
});
