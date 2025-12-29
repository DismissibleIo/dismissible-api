import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SwaggerConfig } from '../swagger';
import { DefaultAppConfig } from './default-app.config';
import { JwtAuthHookConfig } from '@dismissible/nestjs-jwt-auth-hook';
import { StorageConfig } from '../storage/storage.config';

export class AppConfig extends DefaultAppConfig {
  @ValidateNested()
  @Type(() => SwaggerConfig)
  public readonly swagger!: SwaggerConfig;

  @ValidateNested()
  @Type(() => StorageConfig)
  public readonly storage!: StorageConfig;

  @ValidateNested()
  @Type(() => JwtAuthHookConfig)
  public readonly jwtAuth!: JwtAuthHookConfig;
}
