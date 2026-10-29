const PLACEHOLDER_PATTERN = /\$\{(.+?)\}/g;
const DEFAULT_VALUE_SEPARATOR = ':-';
const MAX_REFERENCE_DEPTH = 10;

type Primitive = string | number | boolean;

/**
 * Replaces `${NAME}` and `${NAME:-default}` placeholders in every string value of the config.
 *
 * A placeholder resolves, in order, to:
 *  1. the environment variable `NAME`
 *  2. the value at the dotted path `NAME` within the config itself (eg. `${server.port}`)
 *  3. the default value, if one is given
 *
 * If none of these resolve, an error is thrown so the app never starts with missing config.
 * When a string is exactly one placeholder that references a number or boolean in the config,
 * the original type is kept.
 */
export function substituteVariables(
  config: Record<string, unknown>,
  env: NodeJS.ProcessEnv = process.env,
): Record<string, unknown> {
  return substituteObject(config, config, env, 0);
}

function substituteObject(
  value: object,
  root: Record<string, unknown>,
  env: NodeJS.ProcessEnv,
  depth: number,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, substitute(item, root, env, depth)]),
  );
}

function substitute(
  value: unknown,
  root: Record<string, unknown>,
  env: NodeJS.ProcessEnv,
  depth: number,
): unknown {
  if (typeof value === 'string') {
    return substituteString(value, root, env, depth);
  }
  if (Array.isArray(value)) {
    return value.map((item) => substitute(item, root, env, depth));
  }
  if (value !== null && typeof value === 'object') {
    return substituteObject(value, root, env, depth);
  }
  return value;
}

function substituteString(
  value: string,
  root: Record<string, unknown>,
  env: NodeJS.ProcessEnv,
  depth: number,
): Primitive {
  if (depth > MAX_REFERENCE_DEPTH) {
    throw new Error(`Circular reference detected while resolving config value: '${value}'`);
  }

  const [placeholder] = value.matchAll(PLACEHOLDER_PATTERN);

  if (placeholder && placeholder[0] === value) {
    return resolvePlaceholder(placeholder[1], root, env, depth);
  }

  return value.replace(PLACEHOLDER_PATTERN, (_placeholder: string, expression: string) =>
    String(resolvePlaceholder(expression, root, env, depth)),
  );
}

function resolvePlaceholder(
  expression: string,
  root: Record<string, unknown>,
  env: NodeJS.ProcessEnv,
  depth: number,
): Primitive {
  const [name, ...defaultParts] = expression.split(DEFAULT_VALUE_SEPARATOR);

  const envValue = env[name];
  if (envValue !== undefined) {
    return envValue;
  }

  const reference = resolveReference(name, root);
  if (typeof reference === 'string') {
    return substituteString(reference, root, env, depth + 1);
  }
  if (typeof reference === 'number' || typeof reference === 'boolean') {
    return reference;
  }

  if (defaultParts.length > 0) {
    return defaultParts.join(DEFAULT_VALUE_SEPARATOR);
  }

  throw new Error(`Environment variable is not set for variable name: '${name}'`);
}

function resolveReference(path: string, root: Record<string, unknown>): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    return (current as Record<string, unknown>)[key];
  }, root);
}
