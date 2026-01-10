import { Module, DynamicModule, InjectionToken } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtAuthHook } from './jwt-auth.hook';
import { JwtAuthService } from './jwt-auth.service';
import { DISMISSIBLE_JWT_AUTH_HOOK_CONFIG, JwtAuthHookConfig } from './jwt-auth-hook.config';

/**
 * Async module options for JWT auth hook.
 */
export interface IJwtAuthHookModuleAsyncOptions {
  useFactory: (...args: unknown[]) => JwtAuthHookConfig | Promise<JwtAuthHookConfig>;
  inject?: InjectionToken[];
}

/**
 * Module that provides JWT authentication hook for Dismissible.
 *
 * @example
 * ```typescript
 * import { DismissibleModule } from '@dismissible/nestjs-core';
 * import { JwtAuthHookModule, JwtAuthHook } from '@dismissible/nestjs-jwt-auth-hook';
 *
 * @Module({
 *   imports: [
 *     JwtAuthHookModule.forRoot({
 *       wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
 *       issuer: 'https://auth.example.com',
 *       audience: 'my-api',
 *     }),
 *     DismissibleModule.forRoot({
 *       hooks: [JwtAuthHook],
 *       // ... other options
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class JwtAuthHookModule {
  static forRoot(config: JwtAuthHookConfig): DynamicModule {
    return {
      module: JwtAuthHookModule,
      imports: [HttpModule],
      providers: [
        {
          provide: DISMISSIBLE_JWT_AUTH_HOOK_CONFIG,
          useValue: config,
        },
        JwtAuthService,
        JwtAuthHook,
      ],
      exports: [JwtAuthHook, JwtAuthService, DISMISSIBLE_JWT_AUTH_HOOK_CONFIG],
      global: true,
    };
  }

  /**
   * Create module with async configuration.
   * Useful when config values come from environment or other async sources.
   */
  static forRootAsync(options: IJwtAuthHookModuleAsyncOptions): DynamicModule {
    return {
      module: JwtAuthHookModule,
      imports: [HttpModule],
      providers: [
        {
          provide: DISMISSIBLE_JWT_AUTH_HOOK_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        JwtAuthService,
        JwtAuthHook,
      ],
      exports: [JwtAuthHook, JwtAuthService, DISMISSIBLE_JWT_AUTH_HOOK_CONFIG],
      global: true,
    };
  }
}
