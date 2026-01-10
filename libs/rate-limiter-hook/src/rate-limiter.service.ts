import { Injectable, Inject } from '@nestjs/common';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { IRequestContext } from '@dismissible/nestjs-request';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import {
  DISMISSIBLE_RATE_LIMITER_HOOK_CONFIG,
  RateLimiterHookConfig,
  RateLimitKeyType,
  RateLimitKeyMode,
} from './rate-limiter-hook.config';

/**
 * Result of a rate limit check.
 */
export interface IRateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining points in the current window */
  remainingPoints?: number;
  /** Milliseconds until the rate limit resets */
  msBeforeNext?: number;
  /** Error message if rate limited */
  error?: string;
}

/**
 * Service that handles rate limiting logic using rate-limiter-flexible.
 */
@Injectable()
export class RateLimiterService {
  private readonly rateLimiter: RateLimiterMemory;
  private readonly ignoredKeysSet: ReadonlySet<string>;

  constructor(
    @Inject(DISMISSIBLE_RATE_LIMITER_HOOK_CONFIG)
    private readonly config: RateLimiterHookConfig,
    @Inject(DISMISSIBLE_LOGGER)
    private readonly logger: IDismissibleLogger,
  ) {
    this.rateLimiter = new RateLimiterMemory({
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration,
    });

    this.logger.debug('Rate limiter: Initialized', {
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration,
    });

    this.ignoredKeysSet = new Set(
      (config.ignoredKeys ?? [])
        .map((k) => this.normalizeIgnoredKey(k))
        .filter((k): k is string => Boolean(k)),
    );
  }

  private normalizeIgnoredKey(key: string): string | undefined {
    const normalized = key.trim().toLowerCase();
    return normalized.length > 0 ? normalized : undefined;
  }

  private tryGetHostname(value: string): string | undefined {
    try {
      return new URL(value).hostname.toLowerCase();
    } catch {
      return undefined;
    }
  }

  /**
   * Generate rate limit key(s) based on the configured mode.
   * Returns an array of keys to check.
   */
  generateKeys(context?: IRequestContext): string[] {
    const mode = this.config.keyMode ?? RateLimitKeyMode.AND;

    switch (mode) {
      case RateLimitKeyMode.OR:
        return this.generateOrKey(context);
      case RateLimitKeyMode.ANY:
        return this.generateAnyKeys(context);
      case RateLimitKeyMode.AND:
      default:
        return [this.generateAndKey(context)];
    }
  }

  /**
   * AND mode: Combine all key types into a single key.
   * @deprecated Use generateKeys() instead
   */
  generateKey(context?: IRequestContext): string {
    return this.generateAndKey(context);
  }

  /**
   * AND mode: Combine all key types into a single key.
   */
  private generateAndKey(context?: IRequestContext): string {
    const keyParts: string[] = [];

    for (const keyType of this.config.keyType) {
      const value = this.extractKeyValue(keyType, context);
      if (value) {
        keyParts.push(value);
      }
    }

    // If no key parts could be extracted, use a fallback
    if (keyParts.length === 0) {
      return 'unknown';
    }

    return keyParts.join(':');
  }

  /**
   * OR mode: Use the first available key type (fallback chain).
   */
  private generateOrKey(context?: IRequestContext): string[] {
    for (const keyType of this.config.keyType) {
      const value = this.extractKeyValue(keyType, context);
      if (value) {
        return [value];
      }
    }

    return ['unknown'];
  }

  /**
   * ANY mode: Return all available keys separately.
   * Each key type gets its own rate limit bucket.
   */
  private generateAnyKeys(context?: IRequestContext): string[] {
    const keys: string[] = [];

    for (const keyType of this.config.keyType) {
      const value = this.extractKeyValue(keyType, context);
      if (value) {
        // Prefix with key type to avoid collisions between different key types
        keys.push(`${keyType}:${value}`);
      }
    }

    if (keys.length === 0) {
      return ['unknown'];
    }

    return keys;
  }

  /**
   * Extract a key value based on the key type.
   */
  private extractKeyValue(
    keyType: RateLimitKeyType,
    context?: IRequestContext,
  ): string | undefined {
    if (!context?.headers) {
      return undefined;
    }

    switch (keyType) {
      case RateLimitKeyType.IP:
        return this.extractIp(context);
      case RateLimitKeyType.ORIGIN:
        return this.extractOrigin(context);
      case RateLimitKeyType.REFERRER:
        return this.extractReferrer(context);
      default:
        return undefined;
    }
  }

  /**
   * Extract IP address from headers or connection.
   */
  private extractIp(context: IRequestContext): string | undefined {
    // Check x-forwarded-for header first (for proxied requests)
    const forwardedFor = context.headers['x-forwarded-for'];
    if (forwardedFor) {
      // x-forwarded-for can be a comma-separated list; take the first IP
      const firstIp = forwardedFor.split(',')[0]?.trim();
      if (firstIp) {
        return firstIp;
      }
    }

    // Fall back to x-real-ip
    const realIp = context.headers['x-real-ip'];
    if (realIp) {
      return realIp;
    }

    // Could also check context for direct IP if available
    return undefined;
  }

  /**
   * Extract origin from headers.
   */
  private extractOrigin(context: IRequestContext): string | undefined {
    return context.headers['origin'];
  }

  /**
   * Extract referrer from headers.
   */
  private extractReferrer(context: IRequestContext): string | undefined {
    // Note: The header is spelled "referer" (historical misspelling)
    return context.headers['referer'];
  }

  /**
   * Extract all raw key values from the request context.
   * Used for checking against ignored keys list.
   */
  extractRawKeyValues(context?: IRequestContext): string[] {
    const values: string[] = [];

    for (const keyType of this.config.keyType) {
      const value = this.extractKeyValue(keyType, context);
      if (value) {
        values.push(value);
      }
    }

    return values;
  }

  /**
   * Check if any of the raw key values should be ignored.
   * Uses exact matching:
   * - IPs are matched exactly
   * - Origins/referrers are matched by exact hostname (when parsable as a URL),
   *   and also by exact raw value (to allow whitelisting full origins/URLs).
   */
  isIgnored(context?: IRequestContext): boolean {
    if (this.ignoredKeysSet.size === 0) {
      return false;
    }

    const rawValues = this.extractRawKeyValues(context);

    for (const rawValue of rawValues) {
      const normalizedRaw = rawValue.trim().toLowerCase();

      if (this.ignoredKeysSet.has(normalizedRaw)) {
        this.logger.debug('Rate limiter: Key ignored (exact)', {
          rawValue,
          matchedValue: normalizedRaw,
        });
        return true;
      }

      const hostname = this.tryGetHostname(rawValue);
      if (hostname && this.ignoredKeysSet.has(hostname)) {
        this.logger.debug('Rate limiter: Key ignored (hostname)', {
          rawValue,
          matchedValue: hostname,
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a request should be rate limited.
   */
  async consume(key: string): Promise<IRateLimitResult> {
    try {
      const result = await this.rateLimiter.consume(key);

      this.logger.debug('Rate limiter: Request allowed', {
        key,
        remainingPoints: result.remainingPoints,
        msBeforeNext: result.msBeforeNext,
      });

      return {
        allowed: true,
        remainingPoints: result.remainingPoints,
        msBeforeNext: result.msBeforeNext,
      };
    } catch (error) {
      if (error instanceof RateLimiterRes) {
        this.logger.debug('Rate limiter: Request blocked', {
          key,
          remainingPoints: error.remainingPoints,
          msBeforeNext: error.msBeforeNext,
        });

        return {
          allowed: false,
          remainingPoints: error.remainingPoints,
          msBeforeNext: error.msBeforeNext,
          error: 'Too many requests',
        };
      }

      // Unexpected error - log and allow the request to proceed
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        'Rate limiter: Unexpected error',
        error instanceof Error ? error : new Error(errorMessage),
        { key },
      );

      return {
        allowed: true,
        error: 'Rate limiter error',
      };
    }
  }

  /**
   * Check rate limit for all provided keys.
   * In ANY mode, blocks if ANY key exceeds the limit.
   */
  async consumeAll(keys: string[]): Promise<IRateLimitResult> {
    const results: IRateLimitResult[] = [];

    for (const key of keys) {
      const result = await this.consume(key);
      results.push(result);

      // If any key is blocked, return immediately
      if (!result.allowed) {
        return result;
      }
    }

    // All keys allowed - return the result with the lowest remaining points
    const minRemaining = results.reduce(
      (min, r) => Math.min(min, r.remainingPoints ?? Infinity),
      Infinity,
    );

    return {
      allowed: true,
      remainingPoints: minRemaining === Infinity ? undefined : minRemaining,
      msBeforeNext: results[0]?.msBeforeNext,
    };
  }
}
