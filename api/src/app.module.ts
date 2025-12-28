import { DynamicModule, Module, ModuleMetadata, Type } from '@nestjs/common';
import { HealthModule } from './health';
import { ConfigModule } from './config';
import { AppConfig } from './config/app.config';
import { join } from 'path';
import { DismissibleModule } from '@dismissible/nestjs-dismissible';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';
import { DefaultAppConfig } from './config/default-app.config';
import { PostgresStorageConfig, PostgresStorageModule } from '@dismissible/nestjs-postgres-storage';
import {
  JwtAuthHookModule,
  JwtAuthHook,
  JwtAuthHookConfig,
} from '@dismissible/nestjs-jwt-auth-hook';

export type AppModuleOptions = {
  configPath?: string;
  schema?: new () => DefaultAppConfig;
  logger?: Type<IDismissibleLogger>;
  imports?: DynamicModule[];
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
          hooks: [JwtAuthHook],
          storage: PostgresStorageModule.forRootAsync({
            useFactory(config: PostgresStorageConfig) {
              return {
                connectionString: config.connectionString,
              };
            },
            inject: [PostgresStorageConfig],
          }),
        }),
      ],
    };
  }
}
