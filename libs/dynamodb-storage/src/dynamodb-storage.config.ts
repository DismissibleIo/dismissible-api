import { IsString, IsOptional } from 'class-validator';

export const DISMISSIBLE_DYNAMODB_STORAGE_CONFIG = Symbol('DISMISSIBLE_DYNAMODB_STORAGE_CONFIG');

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
