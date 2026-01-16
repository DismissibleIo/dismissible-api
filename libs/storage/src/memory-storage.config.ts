import { TransformNumber } from '@dismissible/nestjs-validation';
import { IsNumber, IsOptional } from 'class-validator';

/**
 * Injection token for the MemoryStorage configuration.
 */
export const DISMISSIBLE_MEMORY_STORAGE_CONFIG = Symbol('DISMISSIBLE_MEMORY_STORAGE_CONFIG');

export class MemoryStorageConfig {
  @TransformNumber()
  @IsNumber()
  @IsOptional()
  public readonly maxItems?: number;

  @TransformNumber()
  @IsNumber()
  @IsOptional()
  public readonly ttlMs?: number;
}
