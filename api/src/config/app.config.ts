import { IsDefined, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SwaggerConfig } from '../swagger';
import { DefaultAppConfig } from './default-app.config';
import { JwtAuthHookConfig } from '@dismissible/nestjs-jwt-auth-hook';
import { StorageConfig } from '../storage/storage.config';

export class AppConfig extends DefaultAppConfig {
  @ValidateNested()
  @IsDefined()
  @Type(() => SwaggerConfig)
  public readonly swagger!: SwaggerConfig;

  @ValidateNested()
  @IsDefined()
  @Type(() => StorageConfig)
  public readonly storage!: StorageConfig;

  @ValidateNested()
  @IsDefined()
  @Type(() => JwtAuthHookConfig)
  public readonly jwtAuth!: JwtAuthHookConfig;
}
