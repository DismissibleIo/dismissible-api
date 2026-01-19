import { Injectable, Inject } from '@nestjs/common';
import {
  IDismissibleLifecycleHook,
  IHookResult,
  IBatchHookResult,
} from '@dismissible/nestjs-hooks';
import { IRequestContext } from '@dismissible/nestjs-request';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import { RateLimiterService } from './rate-limiter.service';
import {
  DISMISSIBLE_RATE_LIMITER_HOOK_CONFIG,
  RateLimiterHookConfig,
} from './rate-limiter-hook.config';

/**
 * Custom error for rate limiting that includes retry information.
 */
export class TooManyRequestsException extends Error {
  readonly statusCode = 429;
  readonly retryAfter?: number;

  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.name = 'TooManyRequestsException';
    if (retryAfterMs) {
      // Convert milliseconds to seconds for Retry-After header
      this.retryAfter = Math.ceil(retryAfterMs / 1000);
    }
  }
}

/**
 * Rate limiter hook that limits requests based on configured key types.
 * This hook runs during the pre-request phase and rejects requests that exceed the rate limit.
 */
@Injectable()
export class RateLimiterHook implements IDismissibleLifecycleHook {
  readonly priority: number;

  constructor(
    private readonly rateLimiterService: RateLimiterService,
    @Inject(DISMISSIBLE_RATE_LIMITER_HOOK_CONFIG)
    private readonly config: RateLimiterHookConfig,
    @Inject(DISMISSIBLE_LOGGER)
    private readonly logger: IDismissibleLogger,
  ) {
    this.priority = config.priority ?? -101;
  }

  /**
   * Check rate limit before processing the request.
   * Runs before any dismissible operation.
   */
  async onBeforeRequest(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    if (!this.config.enabled) {
      return { proceed: true };
    }

    // Check if request should be ignored (whitelisted)
    if (this.rateLimiterService.isIgnored(context)) {
      this.logger.debug('Rate limit bypassed (ignored key)', {
        itemId,
        userId,
        requestId: context?.requestId,
      });
      return { proceed: true };
    }

    const keys = this.rateLimiterService.generateKeys(context);

    this.logger.debug('Checking rate limit', {
      itemId,
      userId,
      keys,
      requestId: context?.requestId,
    });

    const result = await this.rateLimiterService.consumeAll(keys);

    if (!result.allowed) {
      this.logger.debug('Rate limit exceeded', {
        itemId,
        userId,
        keys,
        requestId: context?.requestId,
        msBeforeNext: result.msBeforeNext,
      });

      throw new TooManyRequestsException(
        'Rate limit exceeded. Please try again later.',
        result.msBeforeNext,
      );
    }

    this.logger.debug('Request allowed', {
      itemId,
      userId,
      keys,
      requestId: context?.requestId,
      remainingPoints: result.remainingPoints,
    });

    return {
      proceed: true,
    };
  }

  /**
   * Check rate limit before processing a batch request.
   * Runs before any batch dismissible operation.
   * Consumes 1 point per batch (treats the batch as a single request).
   */
  async onBeforeBatchRequest(
    itemIds: string[],
    userId: string,
    context?: IRequestContext,
  ): Promise<IBatchHookResult> {
    if (!this.config.enabled) {
      return { proceed: true };
    }

    // Check if request should be ignored (whitelisted)
    if (this.rateLimiterService.isIgnored(context)) {
      this.logger.debug('Rate limit bypassed (ignored key) (batch)', {
        itemCount: itemIds.length,
        userId,
        requestId: context?.requestId,
      });
      return { proceed: true };
    }

    const keys = this.rateLimiterService.generateKeys(context);

    this.logger.debug('Checking rate limit (batch)', {
      itemCount: itemIds.length,
      userId,
      keys,
      requestId: context?.requestId,
    });

    const result = await this.rateLimiterService.consumeAll(keys);

    if (!result.allowed) {
      this.logger.debug('Rate limit exceeded (batch)', {
        itemCount: itemIds.length,
        userId,
        keys,
        requestId: context?.requestId,
        msBeforeNext: result.msBeforeNext,
      });

      throw new TooManyRequestsException(
        'Rate limit exceeded. Please try again later.',
        result.msBeforeNext,
      );
    }

    this.logger.debug('Request allowed (batch)', {
      itemCount: itemIds.length,
      userId,
      keys,
      requestId: context?.requestId,
      remainingPoints: result.remainingPoints,
    });

    return {
      proceed: true,
    };
  }
}
