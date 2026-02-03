import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { TransformNumber, TransformBoolean } from '@dismissible/nestjs-validation';

/**
 * Injection token for the RedisCache configuration.
 */
export const DISMISSIBLE_REDIS_CACHE_CONFIG = Symbol('DISMISSIBLE_REDIS_CACHE_CONFIG');

export class RedisCacheConfig {
  @IsString()
  public readonly url: string;

  @IsString()
  @IsOptional()
  public readonly keyPrefix?: string;

  @TransformNumber()
  @IsNumber()
  @IsOptional()
  public readonly ttlMs?: number;

  @TransformBoolean()
  @IsBoolean()
  @IsOptional()
  public readonly enableReadyCheck?: boolean;

  @TransformNumber()
  @IsNumber()
  @IsOptional()
  public readonly maxRetriesPerRequest?: number;

  @TransformNumber()
  @IsNumber()
  @IsOptional()
  public readonly connectionTimeoutMs?: number;
}
