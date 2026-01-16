import {
  IsBoolean,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  ValidateIf,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransformBoolean, TransformCommaSeparated } from '@dismissible/nestjs-validation';

/**
 * Injection token for rate limiter hook configuration.
 */
export const DISMISSIBLE_RATE_LIMITER_HOOK_CONFIG = Symbol('DISMISSIBLE_RATE_LIMITER_HOOK_CONFIG');

/**
 * Key type for rate limiting - determines how requests are grouped.
 */
export enum RateLimitKeyType {
  /** Rate limit by IP address (from x-forwarded-for or connection IP) */
  IP = 'ip',
  /** Rate limit by Origin header */
  ORIGIN = 'origin',
  /** Rate limit by Referer header */
  REFERRER = 'referrer',
}

/**
 * Mode for combining multiple key types.
 */
export enum RateLimitKeyMode {
  /** Combine all key types into a single key (e.g., "ip:origin") */
  AND = 'and',
  /** Use the first available key type as a fallback chain */
  OR = 'or',
  /** Check all key types independently - blocked if ANY limit exceeded */
  ANY = 'any',
}

/**
 * Configuration options for rate limiter hook.
 */
export class RateLimiterHookConfig {
  @IsBoolean()
  @TransformBoolean()
  public readonly enabled!: boolean;

  /**
   * Number of requests allowed per duration.
   * Defaults to 10.
   */
  @ValidateIf((o) => o.enabled === true)
  @IsNumber()
  @Type(() => Number)
  public readonly points!: number;

  /**
   * Time window in seconds.
   * Defaults to 1 second.
   */
  @ValidateIf((o) => o.enabled === true)
  @IsNumber()
  @Type(() => Number)
  public readonly duration!: number;

  /**
   * Optional: Duration in seconds to block requests after limit is exceeded.
   * If not set, requests are allowed again after the duration window resets.
   */
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  public readonly blockDuration?: number;

  /**
   * Key type(s) for rate limiting.
   * Can be a comma-separated string or array of key types.
   * How multiple types are combined depends on the keyMode setting.
   * Defaults to ['ip'].
   */
  @ValidateIf((o) => o.enabled === true)
  @IsArray()
  @IsEnum(RateLimitKeyType, { each: true })
  @TransformCommaSeparated()
  public readonly keyType!: RateLimitKeyType[];

  /**
   * Mode for combining key types when multiple are specified.
   * - 'and': Combine all into single key (default) - e.g., "192.168.1.1:example.com"
   * - 'or': Use first available key type (fallback chain)
   * - 'any': Check each independently (strictest - blocked if ANY exceeds limit)
   * Defaults to 'and'.
   */
  @IsOptional()
  @IsEnum(RateLimitKeyMode)
  public readonly keyMode?: RateLimitKeyMode;

  /**
   * Optional: Hook priority (lower numbers run first).
   * Defaults to -50 (runs after authentication hooks).
   */
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  public readonly priority?: number;

  /**
   * Optional: Keys that should bypass rate limiting.
   * Can be a comma-separated string or array of strings.
   * Matching is exact (after normalization to lowercase + trim):
   * - IPs are matched exactly (e.g., "192.168.8.1")
   * - Origins/referrers are matched by exact hostname when the header is a valid URL
   *   (e.g., "https://google.com/search" matches ignored key "google.com")
   * - You may also whitelist an exact raw Origin/Referer value by providing the full string
   *   (e.g., "https://example.com:8443")
   * @example ['google.com', '192.168.8.1', 'https://example.com:8443']
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @TransformCommaSeparated()
  public readonly ignoredKeys?: string[];
}
