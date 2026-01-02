import { IsDefined, IsEnum, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PostgresStorageConfig } from '@dismissible/nestjs-postgres-storage';
import { DynamoDBStorageConfig } from '@dismissible/nestjs-dynamodb-storage';

export enum StorageType {
  MEMORY = 'memory',
  POSTGRES = 'postgres',
  DYNAMODB = 'dynamodb',
}

export class StorageConfig {
  @IsDefined()
  @IsEnum(StorageType)
  public readonly type!: StorageType;

  @ValidateIf((o) => o.type === StorageType.POSTGRES)
  @IsDefined()
  @ValidateNested()
  @Type(() => PostgresStorageConfig)
  public readonly postgres!: PostgresStorageConfig;

  @ValidateIf((o) => o.type === StorageType.DYNAMODB)
  @IsDefined()
  @ValidateNested()
  @Type(() => DynamoDBStorageConfig)
  public readonly dynamodb!: DynamoDBStorageConfig;
}
