import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { DISMISSIBLE_STORAGE_ADAPTER } from './storage.interface';
import { MemoryStorageAdapter } from './memory-storage.adapter';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import { MemoryStorageConfig, DISMISSIBLE_MEMORY_STORAGE_CONFIG } from './memory-storage.config';

export interface MemoryStorageModuleOptions {
  maxItems?: number;
  ttlMs?: number;
}

export interface MemoryStorageModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useFactory: (...args: any[]) => MemoryStorageModuleOptions | Promise<MemoryStorageModuleOptions>;
}

@Module({})
export class MemoryStorageModule {
  static forRoot(options: MemoryStorageModuleOptions = {}): DynamicModule {
    return {
      module: MemoryStorageModule,
      providers: [
        {
          provide: DISMISSIBLE_MEMORY_STORAGE_CONFIG,
          useValue: {
            maxItems: options.maxItems,
            ttlMs: options.ttlMs,
          },
        },
        {
          provide: MemoryStorageAdapter,
          useFactory(config: MemoryStorageConfig, logger: IDismissibleLogger) {
            return new MemoryStorageAdapter(config, logger);
          },
          inject: [DISMISSIBLE_MEMORY_STORAGE_CONFIG, DISMISSIBLE_LOGGER],
        },
        {
          provide: DISMISSIBLE_STORAGE_ADAPTER,
          useExisting: MemoryStorageAdapter,
        },
      ],
      exports: [DISMISSIBLE_STORAGE_ADAPTER],
    };
  }

  static forRootAsync(options: MemoryStorageModuleAsyncOptions): DynamicModule {
    return {
      module: MemoryStorageModule,
      imports: [...(options.imports || [])],
      providers: [
        {
          provide: DISMISSIBLE_MEMORY_STORAGE_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: MemoryStorageAdapter,
          useFactory(config: MemoryStorageConfig, logger: IDismissibleLogger) {
            return new MemoryStorageAdapter(config, logger);
          },
          inject: [DISMISSIBLE_MEMORY_STORAGE_CONFIG, DISMISSIBLE_LOGGER],
        },
        {
          provide: DISMISSIBLE_STORAGE_ADAPTER,
          useExisting: MemoryStorageAdapter,
        },
      ],
      exports: [DISMISSIBLE_STORAGE_ADAPTER],
    };
  }
}
