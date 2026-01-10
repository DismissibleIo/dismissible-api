import { Module, DynamicModule, InjectionToken } from '@nestjs/common';
import { RateLimiterHook } from './rate-limiter.hook';
import { RateLimiterService } from './rate-limiter.service';
import {
  DISMISSIBLE_RATE_LIMITER_HOOK_CONFIG,
  RateLimiterHookConfig,
} from './rate-limiter-hook.config';

/**
 * Async module options for rate limiter hook.
 */
export interface IRateLimiterHookModuleAsyncOptions {
  useFactory: (...args: unknown[]) => RateLimiterHookConfig | Promise<RateLimiterHookConfig>;
  inject?: InjectionToken[];
}

/**
 * Module that provides rate limiting hook for Dismissible.
 *
 * @example
 * ```typescript
 * import { DismissibleModule } from '@dismissible/nestjs-core';
 * import { RateLimiterHookModule, RateLimiterHook } from '@dismissible/nestjs-rate-limiter-hook';
 *
 * @Module({
 *   imports: [
 *     RateLimiterHookModule.forRoot({
 *       enabled: true,
 *       points: 10,
 *       duration: 1,
 *       keyType: ['ip'],
 *     }),
 *     DismissibleModule.forRoot({
 *       hooks: [RateLimiterHook],
 *       // ... other options
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class RateLimiterHookModule {
  static forRoot(config: RateLimiterHookConfig): DynamicModule {
    return {
      module: RateLimiterHookModule,
      providers: [
        {
          provide: DISMISSIBLE_RATE_LIMITER_HOOK_CONFIG,
          useValue: config,
        },
        RateLimiterService,
        RateLimiterHook,
      ],
      exports: [RateLimiterHook, RateLimiterService, DISMISSIBLE_RATE_LIMITER_HOOK_CONFIG],
      global: true,
    };
  }

  /**
   * Create module with async configuration.
   * Useful when config values come from environment or other async sources.
   */
  static forRootAsync(options: IRateLimiterHookModuleAsyncOptions): DynamicModule {
    return {
      module: RateLimiterHookModule,
      providers: [
        {
          provide: DISMISSIBLE_RATE_LIMITER_HOOK_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        RateLimiterService,
        RateLimiterHook,
      ],
      exports: [RateLimiterHook, RateLimiterService, DISMISSIBLE_RATE_LIMITER_HOOK_CONFIG],
      global: true,
    };
  }
}
