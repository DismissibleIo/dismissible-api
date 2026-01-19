import {
  IsString,
  IsUrl,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransformBoolean, TransformCommaSeparated } from '@dismissible/nestjs-validation';

/**
 * Injection token for JWT auth hook configuration.
 */
export const DISMISSIBLE_JWT_AUTH_HOOK_CONFIG = Symbol('DISMISSIBLE_JWT_AUTH_HOOK_CONFIG');

/**
 * User ID match type for comparing JWT claim against request userId.
 */
export enum UserIdMatchType {
  /** Exact string match (default) */
  EXACT = 'exact',
  /** Substring match - either value contains the other */
  SUBSTRING = 'substring',
  /** Regex match - tokenUserId is tested against a regex pattern */
  REGEX = 'regex',
}

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
   * Can be a comma-separated string or array of issuers.
   * If not provided, issuer validation is skipped.
   * The token's issuer must match at least one of the provided issuers.
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @TransformCommaSeparated()
  public readonly issuer?: string[];

  /**
   * Optional: Expected audience claim (aud) to validate.
   * If not provided, audience validation is skipped.
   */
  @IsOptional()
  @IsString()
  public readonly audience?: string;

  /**
   * Optional: Allowed algorithms for JWT verification.
   * Can be a comma-separated string or array of algorithms.
   * Defaults to ['RS256'].
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @TransformCommaSeparated()
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
   * Optional: Match the userId parameter against the JWT claim set in userIdClaim.
   * Defaults to true for security. Set to false for service-to-service scenarios.
   */
  @IsOptional()
  @IsBoolean()
  @TransformBoolean(true) // Default to true if not provided
  public readonly matchUserId?: boolean;

  /**
   * Optional: The JWT claim key to use for user ID matching.
   * Defaults to 'sub' (the standard JWT subject claim).
   */
  @IsOptional()
  @IsString()
  public readonly userIdClaim?: string;

  /**
   * Optional: The type of matching to use for user ID comparison.
   * Defaults to 'exact' for strict equality matching.
   */
  @IsOptional()
  @IsEnum(UserIdMatchType)
  public readonly userIdMatchType?: UserIdMatchType;

  /**
   * Optional: Regex pattern for user ID matching.
   * Required when userIdMatchType is 'regex'.
   *
   * The pattern is matched against the tokenUserId from the JWT claim.
   * If the pattern contains a capture group, the first captured group is
   * extracted and compared against the URL's userId.
   * If no capture group exists, the full match is compared.
   *
   * Example: "^(.+)@clients$" extracts everything before "@clients"
   */
  @ValidateIf((o) => o.userIdMatchType === UserIdMatchType.REGEX)
  @IsString()
  public readonly userIdMatchRegex?: string;
}
