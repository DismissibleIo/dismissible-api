import { IsDefined, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ServerConfig } from '../server/server.config';
import { CorsConfig } from '../cors';
import { HelmetConfig } from '../helmet';
import { ValidationConfig } from '../validation';
import { RateLimiterHookConfig } from '@dismissible/nestjs-rate-limiter-hook';
import { StorageConfig } from '../storage/storage.config';

export class DefaultAppConfig {
  @ValidateNested()
  @IsDefined()
  @Type(() => ServerConfig)
  public readonly server!: ServerConfig;

  @IsOptional()
  @ValidateNested()
  @Type(() => RateLimiterHookConfig)
  public readonly rateLimiter?: RateLimiterHookConfig;

  @ValidateNested()
  @IsDefined()
  @Type(() => CorsConfig)
  public readonly cors!: CorsConfig;

  @ValidateNested()
  @IsDefined()
  @Type(() => HelmetConfig)
  public readonly helmet!: HelmetConfig;

  @ValidateNested()
  @IsDefined()
  @Type(() => StorageConfig)
  public readonly storage!: StorageConfig;

  @ValidateNested()
  @IsDefined()
  @Type(() => ValidationConfig)
  public readonly validation!: ValidationConfig;
}
