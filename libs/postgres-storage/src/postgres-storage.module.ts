import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { DISMISSIBLE_STORAGE_ADAPTER } from '@dismissible/nestjs-storage';
import { PostgresStorageAdapter } from './postgres-storage.adapter';
import { PrismaService } from './prisma.service';
import { DismissibleItemModule } from '@dismissible/nestjs-item';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import {
  PostgresStorageConfig,
  DISMISSIBLE_POSTGRES_STORAGE_CONFIG,
} from './postgres-storage.config';

export interface PostgresStorageModuleOptions {
  connectionString: string;
}

export interface PostgresStorageModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useFactory: (
    ...args: any[]
  ) => PostgresStorageModuleOptions | Promise<PostgresStorageModuleOptions>;
}

@Module({})
export class PostgresStorageModule {
  static forRoot(options: PostgresStorageModuleOptions): DynamicModule {
    return {
      module: PostgresStorageModule,
      imports: [DismissibleItemModule],
      providers: [
        {
          provide: DISMISSIBLE_POSTGRES_STORAGE_CONFIG,
          useValue: {
            connectionString: options.connectionString,
          },
        },
        {
          provide: PrismaService,
          useFactory(config: PostgresStorageConfig, logger: IDismissibleLogger) {
            return new PrismaService(config, logger);
          },
          inject: [DISMISSIBLE_POSTGRES_STORAGE_CONFIG, DISMISSIBLE_LOGGER],
        },
        PostgresStorageAdapter,
        {
          provide: DISMISSIBLE_STORAGE_ADAPTER,
          useExisting: PostgresStorageAdapter,
        },
      ],
      exports: [DISMISSIBLE_STORAGE_ADAPTER, PrismaService],
    };
  }

  static forRootAsync(options: PostgresStorageModuleAsyncOptions): DynamicModule {
    return {
      module: PostgresStorageModule,
      imports: [...(options.imports || []), DismissibleItemModule],
      providers: [
        {
          provide: DISMISSIBLE_POSTGRES_STORAGE_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: PrismaService,
          useFactory(config: PostgresStorageConfig, logger: IDismissibleLogger) {
            return new PrismaService(config, logger);
          },
          inject: [DISMISSIBLE_POSTGRES_STORAGE_CONFIG, DISMISSIBLE_LOGGER],
        },
        PostgresStorageAdapter,
        {
          provide: DISMISSIBLE_STORAGE_ADAPTER,
          useExisting: PostgresStorageAdapter,
        },
      ],
      exports: [DISMISSIBLE_STORAGE_ADAPTER, PrismaService],
    };
  }
}
