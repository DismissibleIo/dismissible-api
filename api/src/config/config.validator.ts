import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';

/**
 * Transforms the raw config into an instance of the schema class and validates it.
 * Properties without validation decorators are stripped.
 *
 * @throws Error listing every failed constraint by its config path
 */
export function validateConfig<T extends object>(
  schema: new () => T,
  rawConfig: Record<string, unknown>,
): T {
  const config = plainToInstance(schema, rawConfig, { exposeDefaultValues: true });
  const errors = validateSync(config, { forbidUnknownValues: true, whitelist: true });

  if (errors.length > 0) {
    throw new Error(formatErrors(errors));
  }

  return config;
}

function formatErrors(errors: ValidationError[]): string {
  const messages = flattenErrors(errors).map(({ path, value, constraints }) =>
    [
      `  - config ${path} does not match the following rules:`,
      ...Object.entries(constraints).map(
        ([name, message]) =>
          `    - ${name}: ${message}, current config is \`${JSON.stringify(value)}\``,
      ),
    ].join('\n'),
  );

  return `Configuration is not valid:\n${messages.join('\n')}\n`;
}

function flattenErrors(
  errors: ValidationError[],
  parentPath = '',
): { path: string; value: unknown; constraints: Record<string, string> }[] {
  return errors.flatMap((error) => {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    const own = error.constraints
      ? [{ path, value: error.value, constraints: error.constraints }]
      : [];

    return [...own, ...flattenErrors(error.children ?? [], path)];
  });
}
