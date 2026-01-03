import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { DISMISSIBLE_STORAGE_ADAPTER } from '@dismissible/nestjs-storage';
import { DynamoDBStorageAdapter } from './dynamodb-storage.adapter';
import { DynamoDBClientService } from './dynamodb-client.service';
import { DismissibleItemModule } from '@dismissible/nestjs-item';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import {
  DynamoDBStorageConfig,
  DISMISSIBLE_STORAGE_DYNAMODB_CONFIG,
} from './dynamodb-storage.config';

export interface DynamoDBStorageModuleOptions {
  tableName: string;
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
}

export interface DynamoDBStorageModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useFactory: (
    ...args: any[]
  ) => DynamoDBStorageModuleOptions | Promise<DynamoDBStorageModuleOptions>;
}

@Module({})
export class DynamoDBStorageModule {
  static forRoot(options: DynamoDBStorageModuleOptions): DynamicModule {
    return {
      module: DynamoDBStorageModule,
      imports: [DismissibleItemModule],
      providers: [
        {
          provide: DISMISSIBLE_STORAGE_DYNAMODB_CONFIG,
          useValue: {
            tableName: options.tableName,
            region: options.region,
            endpoint: options.endpoint,
            accessKeyId: options.accessKeyId,
            secretAccessKey: options.secretAccessKey,
            sessionToken: options.sessionToken,
          },
        },
        {
          provide: DynamoDBClientService,
          useFactory(config: DynamoDBStorageConfig, logger: IDismissibleLogger) {
            return new DynamoDBClientService(config, logger);
          },
          inject: [DISMISSIBLE_STORAGE_DYNAMODB_CONFIG, DISMISSIBLE_LOGGER],
        },
        DynamoDBStorageAdapter,
        {
          provide: DISMISSIBLE_STORAGE_ADAPTER,
          useExisting: DynamoDBStorageAdapter,
        },
      ],
      exports: [DISMISSIBLE_STORAGE_ADAPTER, DynamoDBClientService],
    };
  }

  static forRootAsync(options: DynamoDBStorageModuleAsyncOptions): DynamicModule {
    return {
      module: DynamoDBStorageModule,
      imports: [...(options.imports || []), DismissibleItemModule],
      providers: [
        {
          provide: DISMISSIBLE_STORAGE_DYNAMODB_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: DynamoDBClientService,
          useFactory(config: DynamoDBStorageConfig, logger: IDismissibleLogger) {
            return new DynamoDBClientService(config, logger);
          },
          inject: [DISMISSIBLE_STORAGE_DYNAMODB_CONFIG, DISMISSIBLE_LOGGER],
        },
        DynamoDBStorageAdapter,
        {
          provide: DISMISSIBLE_STORAGE_ADAPTER,
          useExisting: DynamoDBStorageAdapter,
        },
      ],
      exports: [DISMISSIBLE_STORAGE_ADAPTER, DynamoDBClientService],
    };
  }
}
