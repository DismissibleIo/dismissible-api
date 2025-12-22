import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { TransformBoolean } from '@dismissible/nestjs-validation';

/**
 * @see https://helmetjs.github.io/
 */
export class HelmetConfig {
  /**
   * Whether to enable Helmet middleware
   */
  @IsBoolean()
  @TransformBoolean()
  public readonly enabled!: boolean;

  /**
   * Whether to enable Content-Security-Policy header.
   * @default true
   */
  @IsBoolean()
  @IsOptional()
  @TransformBoolean()
  public readonly contentSecurityPolicy?: boolean;

  /**
   * Whether to enable Cross-Origin-Embedder-Policy header.
   * @default true
   */
  @IsBoolean()
  @IsOptional()
  @TransformBoolean()
  public readonly crossOriginEmbedderPolicy?: boolean;

  /**
   * HSTS max-age in seconds.
   * @default 31536000 (1 year)
   */
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  public readonly hstsMaxAge?: number;

  /**
   * Whether to include subdomains in HSTS header.
   * @default true
   */
  @IsBoolean()
  @IsOptional()
  @TransformBoolean()
  public readonly hstsIncludeSubDomains?: boolean;

  /**
   * Whether to add HSTS preload directive.
   * @default false
   */
  @IsBoolean()
  @IsOptional()
  @TransformBoolean()
  public readonly hstsPreload?: boolean;
}
