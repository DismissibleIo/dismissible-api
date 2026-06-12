import { wizardConfigSchema } from '../config/schema';
import type { WizardConfig } from '../config/schema';

/**
 * Runs full wizard config through zod and returns a flat map of field path -> error messages.
 * Paths use dot notation, e.g. "storage.connectionString", "core.port".
 */
export function getValidationErrors(config: WizardConfig): Record<string, string[]> {
  const result = wizardConfigSchema.safeParse(config);
  if (result.success) return {};

  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.filter(Boolean).join('.');
    if (!path) continue;
    if (!errors[path]) errors[path] = [];
    errors[path].push(issue.message);
  }
  return errors;
}

const STEP_PREFIXES: Record<number, string> = {
  0: 'core',
  1: 'storage',
  2: 'cache',
  3: 'swagger',
  4: 'jwtAuth',
  5: 'cors',
  6: 'helmet',
  7: 'validation',
  8: 'rateLimiter',
  // 9 = review, no form fields
};

/**
 * Returns whether the given step has any validation errors.
 * Used to disable Next when the current step is invalid.
 */
export function hasStepErrors(stepIndex: number, validation: Record<string, string[]>): boolean {
  const prefix = STEP_PREFIXES[stepIndex];
  if (prefix === undefined) return false; // review step has no fields
  return Object.keys(validation).some((key) => key === prefix || key.startsWith(prefix + '.'));
}

/**
 * Returns the first error message for a field path, or undefined.
 */
export function getFieldError(
  validation: Record<string, string[]>,
  path: string,
): string | undefined {
  const messages = validation[path];
  return messages?.[0];
}
