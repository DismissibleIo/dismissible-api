import { DynamicModule, Module, ModuleMetadata, Type } from '@nestjs/common';
import { HealthModule } from './health';
import { ConfigModule } from './config';
import { AppConfig } from './config/app.config';
import { join } from 'path';
import { DismissibleModule, IDismissibleLifecycleHook } from '@dismissible/nestjs-core';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';
import { DefaultAppConfig } from './config/default-app.config';
import { DynamicStorageModule } from './storage/dynamic-storage.module';
import {
  JwtAuthHookModule,
  JwtAuthHook,
  JwtAuthHookConfig,
} from '@dismissible/nestjs-jwt-auth-hook';
import { StorageType } from './storage/storage.config';

export type AppModuleOptions = {
  configPath?: string;
  schema?: new () => DefaultAppConfig;
  logger?: Type<IDismissibleLogger>;
  imports?: DynamicModule[];
  hooks?: Type<IDismissibleLifecycleHook>[];
  storage?: StorageType;
};

@Module({})
export class AppModule {
  static forRoot(options?: AppModuleOptions) {
    return {
      module: AppModule,
      ...this.getModuleMetadata(options),
    };
  }

  static getModuleMetadata(options?: AppModuleOptions): ModuleMetadata {
    return {
      imports: [
        ConfigModule.forRoot({
          path: options?.configPath ?? join(__dirname, '../config'),
          schema: options?.schema ?? AppConfig,
        }),
        HealthModule,
        ...(options?.imports ?? []),
        JwtAuthHookModule.forRootAsync({
          useFactory: (config: JwtAuthHookConfig) => config,
          inject: [JwtAuthHookConfig],
        }),
        DismissibleModule.forRoot({
          logger: options?.logger,
          hooks: [JwtAuthHook, ...(options?.hooks ?? [])],
          storage: DynamicStorageModule.forRootAsync({
            // TODO: nestjs doesn't support optional dynamic modules.
            //   So instead, we are just using the env vars to switch between modules.
            //   This isn't ideal, but there's not a great option. I will look to see
            //   if we can raise an issue similar to this: https://github.com/nestjs/nest/issues/9868
            storage: options?.storage ?? (process.env.DISMISSIBLE_STORAGE_TYPE as StorageType),
          }),
        }),
      ],
    };
  }
}
