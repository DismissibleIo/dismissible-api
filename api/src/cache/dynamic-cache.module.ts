import { DynamicModule, Module } from '@nestjs/common';
import { RedisCacheModule } from '@dismissible/nestjs-redis-cache';
import { CacheConfig, CacheType } from './cache.config';
import { MemoryCacheModule } from '@dismissible/nestjs-memory-cache';
import { CacheModule } from '@dismissible/nestjs-cache';

export type DynamicCacheModuleOptions = {
  cache?: CacheType;
};

@Module({})
export class DynamicCacheModule {
  static forRootAsync({ cache }: DynamicCacheModuleOptions): DynamicModule {
    switch (cache) {
      case CacheType.REDIS:
        return RedisCacheModule.forRootAsync({
          useFactory: (config: CacheConfig) => {
            return config.redis;
          },
          inject: [CacheConfig],
        });
      case CacheType.MEMORY:
        return MemoryCacheModule.forRootAsync({
          useFactory: (config: CacheConfig) => config.memory,
          inject: [CacheConfig],
        });
      default:
        return {
          module: CacheModule,
        };
    }
  }
}
