import { DynamicModule, Module } from '@nestjs/common';
import { DISMISSIBLE_STORAGE_ADAPTER } from '@dismissible/nestjs-storage';
import { PostgresStorageModule } from '@dismissible/nestjs-postgres-storage';
import { StorageConfig, StorageType } from './storage.config';
import { DynamoDBStorageModule } from '@dismissible/nestjs-dynamodb-storage';

@Module({})
export class StorageModule {
  static forRootAsync(): DynamicModule {
    return {
      module: StorageModule,
      providers: [
        {
          provide: DISMISSIBLE_STORAGE_ADAPTER,
          useFactory: async (config: StorageConfig): Promise<DynamicModule> => {
            switch (config.type) {
              case StorageType.POSTGRES:
                return PostgresStorageModule.forRoot({
                  ...config.postgres,
                });
              case StorageType.DYNAMODB:
                return DynamoDBStorageModule.forRoot({
                  ...config.dynamodb,
                });
              case StorageType.IN_MEMORY:
              default:
                return undefined;
            }
          },
          inject: [StorageConfig],
        },
      ],
      exports: [DISMISSIBLE_STORAGE_ADAPTER],
    };
  }
}
