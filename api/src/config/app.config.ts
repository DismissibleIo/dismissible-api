import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SwaggerConfig } from '../swagger';
import { DefaultAppConfig } from './default-app.config';
import { PostgresStorageConfig } from '@dismissible/nestjs-postgres-storage';
import { JwtAuthHookConfig } from '@dismissible/nestjs-jwt-auth-hook';

export class AppConfig extends DefaultAppConfig {
  @ValidateNested()
  @Type(() => SwaggerConfig)
  public readonly swagger!: SwaggerConfig;

  @ValidateNested()
  @Type(() => PostgresStorageConfig)
  public readonly db!: PostgresStorageConfig;

  @ValidateNested()
  @Type(() => JwtAuthHookConfig)
  public readonly jwtAuth!: JwtAuthHookConfig;
}
