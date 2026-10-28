import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { substituteVariables } from './variable-substitution';

const CONFIG_BASENAME = '.env';

const PARSERS: Record<string, (content: string) => unknown> = {
  yaml: parseYaml,
  yml: parseYaml,
  json: JSON.parse,
};

/**
 * Formats supported by earlier versions, detected only to give a helpful error.
 */
const UNSUPPORTED_EXTENSIONS = ['toml', 'js'];

export interface IConfigFileLoaderOptions {
  /**
   * The directory to search for the configuration file
   */
  searchFrom: string;
  /**
   * Whether to skip `${VAR}` substitution in config values
   */
  ignoreEnvironmentVariableSubstitution?: boolean;
  /**
   * The environment used for `NODE_ENV` file selection and variable substitution
   */
  env?: NodeJS.ProcessEnv;
}

/**
 * Loads the configuration file from `searchFrom`.
 *
 * Files are searched in this order, and the first non-empty file wins:
 *  1. `.env.{NODE_ENV}.{yaml,yml,json}`
 *  2. `.env.{yaml,yml,json}`
 */
export function loadConfigFile(options: IConfigFileLoaderOptions): Record<string, unknown> {
  const env = options.env ?? process.env;

  for (const filePath of getSearchPaths(options.searchFrom, env.NODE_ENV)) {
    if (!existsSync(filePath)) {
      continue;
    }

    const content = readFileSync(filePath, 'utf8');
    if (content.trim() === '') {
      continue;
    }

    const config = parseConfigFile(filePath, content);

    return options.ignoreEnvironmentVariableSubstitution
      ? config
      : substituteVariables(config, env);
  }

  const unsupportedFile = getSearchPaths(
    options.searchFrom,
    env.NODE_ENV,
    UNSUPPORTED_EXTENSIONS,
  ).find((filePath) => existsSync(filePath));
  if (unsupportedFile) {
    throw new Error(
      `Found configuration file '${unsupportedFile}', but only ${Object.keys(PARSERS)
        .map((extension) => `.${extension}`)
        .join(', ')} configuration files are supported. Please convert it to YAML.`,
    );
  }

  throw new Error(`Failed to find configuration file in '${options.searchFrom}'.`);
}

function getSearchPaths(
  searchFrom: string,
  nodeEnv: string | undefined,
  extensions: string[] = Object.keys(PARSERS),
): string[] {
  const basenames = nodeEnv
    ? [`${CONFIG_BASENAME}.${nodeEnv}`, CONFIG_BASENAME]
    : [CONFIG_BASENAME];

  return basenames.flatMap((basename) =>
    extensions.map((extension) => join(searchFrom, `${basename}.${extension}`)),
  );
}

function parseConfigFile(filePath: string, content: string): Record<string, unknown> {
  const extension = filePath.slice(filePath.lastIndexOf('.') + 1);

  let config: unknown;
  try {
    config = PARSERS[extension](content);
  } catch (error) {
    throw new Error(
      `Failed to parse configuration file '${filePath}': ${(error as Error).message}`,
    );
  }

  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error(`Configuration file '${filePath}' must contain an object.`);
  }

  return config as Record<string, unknown>;
}
