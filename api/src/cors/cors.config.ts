import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransformBoolean, TransformCommaSeparated } from '@dismissible/nestjs-validation';

export class CorsConfig {
  @IsBoolean()
  @TransformBoolean()
  public readonly enabled!: boolean;

  @ValidateIf((o) => o.enabled === true)
  @IsArray()
  @ArrayNotEmpty({ message: 'origins must not be empty when CORS is enabled' })
  @IsString({ each: true })
  @TransformCommaSeparated()
  public readonly origins?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @TransformCommaSeparated()
  public readonly methods?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @TransformCommaSeparated()
  public readonly allowedHeaders?: string[];

  @IsBoolean()
  @IsOptional()
  @TransformBoolean()
  public readonly credentials?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  public readonly maxAge?: number;
}
