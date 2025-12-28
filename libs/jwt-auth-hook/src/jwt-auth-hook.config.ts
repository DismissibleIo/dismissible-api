import {
  IsString,
  IsUrl,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransformBoolean } from '@dismissible/nestjs-validation';

/**
 * Injection token for JWT auth hook configuration.
 */
export const JWT_AUTH_HOOK_CONFIG = Symbol('JWT_AUTH_HOOK_CONFIG');

/**
 * Configuration options for JWT authentication hook.
 */
export class JwtAuthHookConfig {
  @IsBoolean()
  @TransformBoolean()
  public readonly enabled!: boolean;

  /**
   * The OpenID Connect well-known URL (e.g., https://auth.example.com/.well-known/openid-configuration).
   * The JWKS URI will be fetched from this endpoint.
   */
  @ValidateIf((o) => o.enabled === true)
  @IsUrl()
  public readonly wellKnownUrl!: string;

  /**
   * Optional: Expected issuer claim (iss) to validate.
   * If not provided, issuer validation is skipped.
   */
  @IsOptional()
  @IsString()
  public readonly issuer?: string;

  /**
   * Optional: Expected audience claim (aud) to validate.
   * If not provided, audience validation is skipped.
   */
  @IsOptional()
  @IsString()
  public readonly audience?: string;

  /**
   * Optional: Allowed algorithms for JWT verification.
   * Defaults to ['RS256'].
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public readonly algorithms?: string[];

  /**
   * Optional: Cache duration in milliseconds for JWKS.
   * Defaults to 600000 (10 minutes).
   */
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  public readonly jwksCacheDuration?: number;

  /**
   * Optional: Request timeout in milliseconds.
   * Defaults to 30000 (30 seconds).
   */
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  public readonly requestTimeout?: number;

  /**
   * Optional: Hook priority (lower numbers run first).
   * Defaults to -100 (runs early for authentication).
   */
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  public readonly priority?: number;

  /**
   * Optional: Verify that the userId parameter matches the JWT subject (sub) claim.
   * Defaults to true for security. Set to false for service-to-service scenarios.
   */
  @IsOptional()
  @IsBoolean()
  @TransformBoolean(true) // Default to true if not provided
  public readonly verifyUserIdMatch?: boolean;
}
