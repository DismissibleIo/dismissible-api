import { IsString, IsOptional } from 'class-validator';

export const DISMISSIBLE_STORAGE_DYNAMODB_CONFIG = Symbol('DISMISSIBLE_STORAGE_DYNAMODB_CONFIG');

export class DynamoDBStorageConfig {
  @IsString()
  public readonly tableName!: string;

  @IsString()
  @IsOptional()
  public readonly region?: string;

  @IsString()
  @IsOptional()
  public readonly endpoint?: string;

  @IsString()
  @IsOptional()
  public readonly accessKeyId?: string;

  @IsString()
  @IsOptional()
  public readonly secretAccessKey?: string;

  @IsString()
  @IsOptional()
  public readonly sessionToken?: string;
}
