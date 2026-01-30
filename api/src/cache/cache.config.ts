import { IsEnum, IsOptional, ValidateIf, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { RedisCacheConfig } from '@dismissible/nestjs-redis-cache';
import { MemoryCacheConfig } from '@dismissible/nestjs-memory-cache';

export enum CacheType {
  REDIS = 'redis',
  MEMORY = 'memory',
}

export class CacheConfig {
  @IsOptional()
  @IsEnum(CacheType)
  @Transform(({ value }) => (value === '' ? undefined : value))
  public readonly type?: CacheType;

  @ValidateIf((o) => o.type === CacheType.REDIS)
  @IsOptional()
  @ValidateNested()
  @Type(() => RedisCacheConfig)
  public readonly redis!: RedisCacheConfig;

  @ValidateIf((o) => o.type === CacheType.MEMORY)
  @IsOptional()
  @ValidateNested()
  @Type(() => MemoryCacheConfig)
  public readonly memory!: MemoryCacheConfig;
}
