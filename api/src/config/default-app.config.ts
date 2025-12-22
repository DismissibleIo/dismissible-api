import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ServerConfig } from '../server/server.config';
import { CorsConfig } from '../cors';
import { HelmetConfig } from '../helmet';
import { ValidationConfig } from '../validation';

export class DefaultAppConfig {
  @ValidateNested()
  @Type(() => ServerConfig)
  public readonly server!: ServerConfig;

  @ValidateNested()
  @Type(() => CorsConfig)
  public readonly cors!: CorsConfig;

  @ValidateNested()
  @Type(() => HelmetConfig)
  public readonly helmet!: HelmetConfig;

  @ValidateNested()
  @Type(() => ValidationConfig)
  public readonly validation!: ValidationConfig;
}
