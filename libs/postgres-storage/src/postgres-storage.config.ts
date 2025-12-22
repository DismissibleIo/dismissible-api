import { IsString } from 'class-validator';

/**
 * Injection token for the PostgresStorage configuration.
 */
export const DISMISSIBLE_POSTGRES_STORAGE_CONFIG = Symbol('DISMISSIBLE_POSTGRES_STORAGE_CONFIG');

export class PostgresStorageConfig {
  @IsString()
  public readonly connectionString!: string;
}
