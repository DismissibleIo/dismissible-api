import { DynamicModule, Global, Module, ValueProvider } from '@nestjs/common';
import { join } from 'path';
import { loadConfigFile } from './config-file.loader';
import { validateConfig } from './config.validator';

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
   * Register the ConfigModule with a configuration schema.
   *
   * The validated config is injectable by its schema class, and every nested config
   * class instance is injectable by its own class (eg. `ServerConfig`).
   *
   * @param options Configuration options including the schema class
   * @returns A global dynamic module providing the validated configuration
   */
  static forRoot<T extends object>(options: IConfigModuleOptions<T>): DynamicModule {
    const rawConfig = loadConfigFile({
      searchFrom: options.path ?? join(__dirname, '../../config'),
      ignoreEnvironmentVariableSubstitution: options.ignoreEnvironmentVariableSubstitution ?? false,
    });
    const config = validateConfig(options.schema, rawConfig);
    const providers = getConfigProviders(config, options.schema);

    return {
      module: ConfigModule,
      providers,
      exports: providers,
    };
  }
}

/**
 * Creates a provider for the config and for each nested class instance within it.
 * If the same class appears more than once, the last occurrence is provided.
 */
export function getConfigProviders<T extends object>(
  config: T,
  schema: new () => T,
): ValueProvider[] {
  const providers: ValueProvider[] = [{ provide: schema, useValue: config }];

  const visit = (value: object) => {
    for (const child of Object.values(value)) {
      if (child === null || typeof child !== 'object' || Array.isArray(child)) {
        continue;
      }
      if (child.constructor !== Object) {
        providers.push({ provide: child.constructor, useValue: child });
      }
      visit(child);
    }
  };
  visit(config);

  return providers;
}
