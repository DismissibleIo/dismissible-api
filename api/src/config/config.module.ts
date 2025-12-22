import { DynamicModule, Global, Module } from '@nestjs/common';
import { fileLoader, TypedConfigModule } from 'nest-typed-config';
import { join } from 'path';

export interface IConfigModuleOptions<T> {
  /**
   * The configuration schema class to validate against
   */
  schema: new () => T;
  /**
   * The path to search for configuration files
   * Defaults to a 'config' directory two levels up from the current file
   */
  path?: string;
  /**
   * Whether to ignore environment variable substitution in config files
   * Defaults to false (environment variables will be substituted)
   */
  ignoreEnvironmentVariableSubstitution?: boolean;
}

@Global()
@Module({})
export class ConfigModule {
  /**
   * Register the ConfigModule with a configuration schema
   * @param options Configuration options including the schema class
   * @returns A dynamic module configured with TypedConfigModule
   */
  static forRoot<T extends object>(options: IConfigModuleOptions<T>): DynamicModule {
    const configPath = options.path ?? join(__dirname, '../../config');
    const ignoreEnvSubstitution = options.ignoreEnvironmentVariableSubstitution ?? false;

    return {
      module: ConfigModule,
      imports: [
        TypedConfigModule.forRoot({
          schema: options.schema,
          load: [
            fileLoader({
              searchFrom: configPath,
              ignoreEnvironmentVariableSubstitution: ignoreEnvSubstitution,
            }),
          ],
        }),
      ],
      exports: [TypedConfigModule],
    };
  }
}
