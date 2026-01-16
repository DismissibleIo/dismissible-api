import { DynamicModule, Module } from '@nestjs/common';
import { PostgresStorageModule } from '@dismissible/nestjs-postgres-storage';
import { StorageConfig, StorageType } from './storage.config';
import { DynamoDBStorageModule } from '@dismissible/nestjs-dynamodb-storage';
import { MemoryStorageModule } from '@dismissible/nestjs-storage';

export type DynamicStorageModuleOptions = {
  storage?: StorageType;
};

@Module({})
export class DynamicStorageModule {
  static forRootAsync({ storage }: DynamicStorageModuleOptions): DynamicModule {
    switch (storage) {
      case StorageType.DYNAMODB:
        return DynamoDBStorageModule.forRootAsync({
          useFactory: (config: StorageConfig) => config.dynamodb,
          inject: [StorageConfig],
        });
      case StorageType.POSTGRES:
        return PostgresStorageModule.forRootAsync({
          useFactory: (config: StorageConfig) => config.postgres,
          inject: [StorageConfig],
        });
      case StorageType.MEMORY:
      default:
        return MemoryStorageModule.forRootAsync({
          useFactory: (config: StorageConfig) => config?.memory || {},
          inject: [StorageConfig],
        });
    }
  }
}
