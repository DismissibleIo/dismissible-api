import { DynamicModule, InjectionToken, Module, ModuleMetadata } from '@nestjs/common';
import { DISMISSIBLE_CACHE_ADAPTER } from '@dismissible/nestjs-cache';
import { RedisCacheAdapter } from './redis-cache.adapter';
import { RedisClientService } from './redis-client.service';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import { RedisCacheConfig, DISMISSIBLE_REDIS_CACHE_CONFIG } from './redis-cache.config';

export interface RedisCacheModuleOptions {
  url: string;
  keyPrefix?: string;
  ttlMs?: number;
  enableReadyCheck?: boolean;
  maxRetriesPerRequest?: number;
  connectionTimeoutMs?: number;
}

export interface RedisCacheModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: InjectionToken[];
  useFactory: (...args: unknown[]) => RedisCacheModuleOptions | Promise<RedisCacheModuleOptions>;
}

@Module({})
export class RedisCacheModule {
  static forRoot(options: RedisCacheModuleOptions): DynamicModule {
    return {
      module: RedisCacheModule,
      providers: [
        {
          provide: DISMISSIBLE_REDIS_CACHE_CONFIG,
          useValue: {
            url: options.url,
            keyPrefix: options.keyPrefix,
            ttlMs: options.ttlMs,
            enableReadyCheck: options.enableReadyCheck,
            maxRetriesPerRequest: options.maxRetriesPerRequest,
            connectionTimeoutMs: options.connectionTimeoutMs,
          },
        },
        {
          provide: RedisClientService,
          useFactory(config: RedisCacheConfig, logger: IDismissibleLogger) {
            return new RedisClientService(config, logger);
          },
          inject: [DISMISSIBLE_REDIS_CACHE_CONFIG, DISMISSIBLE_LOGGER],
        },
        {
          provide: RedisCacheAdapter,
          useFactory(
            redisClient: RedisClientService,
            config: RedisCacheConfig,
            logger: IDismissibleLogger,
          ) {
            return new RedisCacheAdapter(redisClient, config, logger);
          },
          inject: [RedisClientService, DISMISSIBLE_REDIS_CACHE_CONFIG, DISMISSIBLE_LOGGER],
        },
        {
          provide: DISMISSIBLE_CACHE_ADAPTER,
          useExisting: RedisCacheAdapter,
        },
      ],
      exports: [DISMISSIBLE_CACHE_ADAPTER],
    };
  }

  static forRootAsync(options: RedisCacheModuleAsyncOptions): DynamicModule {
    return {
      module: RedisCacheModule,
      imports: [...(options.imports || [])],
      providers: [
        {
          provide: DISMISSIBLE_REDIS_CACHE_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: RedisClientService,
          useFactory(config: RedisCacheConfig, logger: IDismissibleLogger) {
            return new RedisClientService(config, logger);
          },
          inject: [DISMISSIBLE_REDIS_CACHE_CONFIG, DISMISSIBLE_LOGGER],
        },
        {
          provide: RedisCacheAdapter,
          useFactory(
            redisClient: RedisClientService,
            config: RedisCacheConfig,
            logger: IDismissibleLogger,
          ) {
            return new RedisCacheAdapter(redisClient, config, logger);
          },
          inject: [RedisClientService, DISMISSIBLE_REDIS_CACHE_CONFIG, DISMISSIBLE_LOGGER],
        },
        {
          provide: DISMISSIBLE_CACHE_ADAPTER,
          useExisting: RedisCacheAdapter,
        },
      ],
      exports: [DISMISSIBLE_CACHE_ADAPTER],
    };
  }
}
