import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';

type ConfigValidationIssue = {
  path: string;
  value: unknown;
  constraints: Record<string, string>;
};

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
  const messages = flattenErrors(errors).map(formatValidationIssue);

  return `Configuration is not valid:\n${messages.join('\n')}\n`;
}

function formatValidationIssue(issue: ConfigValidationIssue): string {
  const header = `  - config ${issue.path} does not match the following rules:`;
  const currentValue = JSON.stringify(issue.value);
  const rules = Object.entries(issue.constraints).map(
    ([name, message]) => `    - ${name}: ${message}, current config is \`${currentValue}\``,
  );

  return [header, ...rules].join('\n');
}

function flattenErrors(errors: ValidationError[], parentPath = ''): ConfigValidationIssue[] {
  const issues: ConfigValidationIssue[] = [];

  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    if (error.constraints) {
      issues.push({ path, value: error.value, constraints: error.constraints });
    }

    issues.push(...flattenErrors(error.children ?? [], path));
  }

  return issues;
}
