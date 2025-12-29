import { IsEnum, ValidateIf, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PostgresStorageConfig } from '@dismissible/nestjs-postgres-storage';
import { DynamoDBStorageConfig } from '@dismissible/nestjs-dynamodb-storage';

export enum StorageType {
  IN_MEMORY = 'in-memory',
  POSTGRES = 'postgres',
  DYNAMODB = 'dynamodb',
}

export class StorageConfig {
  @IsEnum(StorageType)
  @Transform(({ value }) => (value ? StorageType[value] : value))
  public readonly type!: StorageType;

  @ValidateIf((o) => o.type !== StorageType.POSTGRES)
  @ValidateNested()
  @Type(() => PostgresStorageConfig)
  public readonly postgres?: PostgresStorageConfig;

  @ValidateIf((o) => o.type !== StorageType.DYNAMODB)
  @ValidateNested()
  @Type(() => DynamoDBStorageConfig)
  public readonly dynamodb?: DynamoDBStorageConfig;
}
