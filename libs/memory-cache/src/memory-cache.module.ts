import { DynamicModule, InjectionToken, Module, ModuleMetadata } from '@nestjs/common';
import { DISMISSIBLE_CACHE_ADAPTER } from '@dismissible/nestjs-cache';
import { MemoryCacheAdapter } from './memory-cache.adapter';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import { MemoryCacheConfig, DISMISSIBLE_MEMORY_CACHE_CONFIG } from './memory-cache.config';

export interface MemoryCacheModuleOptions {
  maxItems?: number;
  ttlMs?: number;
}

export interface MemoryCacheModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: InjectionToken[];
  useFactory: (...args: any[]) => MemoryCacheModuleOptions | Promise<MemoryCacheModuleOptions>;
}

@Module({})
export class MemoryCacheModule {
  static forRoot(options: MemoryCacheModuleOptions = {}): DynamicModule {
    return {
      module: MemoryCacheModule,
      providers: [
        {
          provide: DISMISSIBLE_MEMORY_CACHE_CONFIG,
          useValue: {
            maxItems: options.maxItems,
            ttlMs: options.ttlMs,
          },
        },
        {
          provide: MemoryCacheAdapter,
          useFactory(config: MemoryCacheConfig, logger: IDismissibleLogger) {
            return new MemoryCacheAdapter(config, logger);
          },
          inject: [DISMISSIBLE_MEMORY_CACHE_CONFIG, DISMISSIBLE_LOGGER],
        },
        {
          provide: DISMISSIBLE_CACHE_ADAPTER,
          useExisting: MemoryCacheAdapter,
        },
      ],
      exports: [DISMISSIBLE_CACHE_ADAPTER],
    };
  }

  static forRootAsync(options: MemoryCacheModuleAsyncOptions): DynamicModule {
    return {
      module: MemoryCacheModule,
      imports: [...(options.imports || [])],
      providers: [
        {
          provide: DISMISSIBLE_MEMORY_CACHE_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: MemoryCacheAdapter,
          useFactory(config: MemoryCacheConfig, logger: IDismissibleLogger) {
            return new MemoryCacheAdapter(config, logger);
          },
          inject: [DISMISSIBLE_MEMORY_CACHE_CONFIG, DISMISSIBLE_LOGGER],
        },
        {
          provide: DISMISSIBLE_CACHE_ADAPTER,
          useExisting: MemoryCacheAdapter,
        },
      ],
      exports: [DISMISSIBLE_CACHE_ADAPTER],
    };
  }
}
