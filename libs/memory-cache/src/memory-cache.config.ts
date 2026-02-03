import { TransformNumber } from '@dismissible/nestjs-validation';
import { IsNumber, IsOptional } from 'class-validator';

/**
 * Injection token for the MemoryCache configuration.
 */
export const DISMISSIBLE_MEMORY_CACHE_CONFIG = Symbol('DISMISSIBLE_MEMORY_CACHE_CONFIG');

export class MemoryCacheConfig {
  @TransformNumber()
  @IsNumber()
  @IsOptional()
  public readonly maxItems?: number;

  @TransformNumber()
  @IsNumber()
  @IsOptional()
  public readonly ttlMs?: number;
}
