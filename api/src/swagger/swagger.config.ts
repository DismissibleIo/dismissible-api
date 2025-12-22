import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { TransformBoolean } from '@dismissible/nestjs-validation';

export class SwaggerConfig {
  @IsBoolean()
  @TransformBoolean()
  public readonly enabled!: boolean;

  @IsString()
  @IsOptional()
  public readonly path?: string;
}
