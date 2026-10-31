import { DynamicModule, Module, ModuleMetadata, Type } from '@nestjs/common';
import { HealthModule } from './health';
import { ConfigModule, loadConfig } from './config';
import { AppConfig } from './config/app.config';
import { join } from 'path';
import { DismissibleModule, IDismissibleLifecycleHook } from '@dismissible/nestjs-core';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';
import { DynamicStorageModule } from './storage/dynamic-storage.module';
import {
  JwtAuthHookModule,
  JwtAuthHook,
  JwtAuthHookConfig,
} from '@dismissible/nestjs-jwt-auth-hook';
import { StorageType } from './storage/storage.config';
import { DynamicCacheModule } from './cache/dynamic-cache.module';
import { CacheType } from './cache/cache.config';
import {
  RateLimiterHook,
  RateLimiterHookConfig,
  RateLimiterHookModule,
} from '@dismissible/nestjs-rate-limiter-hook';
import { plainToClass } from 'class-transformer';

export type AppModuleOptions = {
  configPath?: string;
  schema?: new () => AppConfig;
  logger?: Type<IDismissibleLogger>;
  imports?: DynamicModule[];
  hooks?: Type<IDismissibleLifecycleHook>[];
  storage?: StorageType;
  cache?: CacheType;
};

function withBackendOverrides(
  rawConfig: Record<string, unknown>,
  options?: AppModuleOptions,
): Record<string, unknown> {
  return {
    ...rawConfig,
    ...(options?.storage && {
      storage: { ...(rawConfig.storage as object), type: options.storage },
    }),
    ...(options?.cache && {
      cache: { ...(rawConfig.cache as object), type: options.cache },
    }),
  };
}

@Module({})
export class AppModule {
  static forRoot(options?: AppModuleOptions) {
    return {
      module: AppModule,
      ...this.getModuleMetadata(options),
    };
  }

  static getModuleMetadata(options?: AppModuleOptions): ModuleMetadata {
    const schema = options?.schema ?? AppConfig;
    const config = loadConfig({
      path: options?.configPath ?? join(__dirname, '../config'),
      schema,
      transform: (rawConfig) => withBackendOverrides(rawConfig, options),
    });

    return {
      imports: [
        ConfigModule.forConfig(config, schema),
        HealthModule,
        ...(options?.imports ?? []),
        RateLimiterHookModule.forRootAsync({
          useFactory: (config: AppConfig) => {
            return config.rateLimiter ?? plainToClass(RateLimiterHookConfig, { enabled: false });
          },
          inject: [schema],
        }),
        JwtAuthHookModule.forRootAsync({
          useFactory: (config: JwtAuthHookConfig) => config,
          inject: [JwtAuthHookConfig],
        }),
        DismissibleModule.forRoot({
          logger: options?.logger,
          hooks: [JwtAuthHook, RateLimiterHook, ...(options?.hooks ?? [])],
          storage: DynamicStorageModule.forRootAsync({
            // TODO: nestjs doesn't support optional dynamic modules.
            //   So instead, we are loading the config up front to switch between modules.
            //   This isn't ideal, but there's not a great option. I will look to see
            //   if we can raise an issue similar to this: https://github.com/nestjs/nest/issues/9868
            storage: config.storage.type,
          }),
          cache: DynamicCacheModule.forRootAsync({
            cache: config.cache?.type,
          }),
        }),
      ],
    };
  }
}
