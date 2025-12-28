import { IsBoolean, IsOptional } from 'class-validator';
import { TransformBoolean } from '@dismissible/nestjs-validation';

/**
 * Configuration for NestJS ValidationPipe
 * @see https://docs.nestjs.com/techniques/validation
 */
export class ValidationConfig {
  /**
   * Whether to disable error messages in validation responses.
   * Should be true in production to prevent information disclosure.
   * @default true in production, false in development
   */
  @IsBoolean()
  @IsOptional()
  @TransformBoolean()
  public readonly disableErrorMessages?: boolean;

  /**
   * If set to true, validator will strip validated (returned) object of any properties
   * that do not use any validation decorators.
   * @default true
   */
  @IsBoolean()
  @IsOptional()
  @TransformBoolean()
  public readonly whitelist?: boolean;

  /**
   * If set to true, instead of stripping non-whitelisted properties,
   * validator will throw an error.
   * @default true
   */
  @IsBoolean()
  @IsOptional()
  @TransformBoolean()
  public readonly forbidNonWhitelisted?: boolean;

  /**
   * If set to true, class-transformer will attempt transformation based on TS reflected type.
   * @default true
   */
  @IsBoolean()
  @IsOptional()
  @TransformBoolean()
  public readonly transform?: boolean;
}
