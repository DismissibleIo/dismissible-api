/**
 * Security utilities for escaping user input in generated output.
 */

/**
 * Escape a value for safe use in shell double-quoted strings.
 * Handles: $ ` \ " ! and newlines
 */
export function escapeShellValue(value: string | number | boolean): string {
  const str = String(value);
  return str
    .replace(/\\/g, '\\\\') // Backslashes first
    .replace(/\$/g, '\\$') // Dollar signs (prevent command substitution)
    .replace(/`/g, '\\`') // Backticks (prevent command substitution)
    .replace(/"/g, '\\"') // Double quotes
    .replace(/!/g, '\\!') // Exclamation marks (history expansion in some shells)
    .replace(/\n/g, '\\n') // Newlines
    .replace(/\r/g, '\\r'); // Carriage returns
}

/**
 * Escape a value for safe use in .env files.
 * Values containing special characters are wrapped in double quotes.
 * Quotes and backslashes within the value are escaped.
 */
export function escapeEnvValue(value: string | number | boolean): string {
  const str = String(value);

  // If the value is simple (no special chars), return as-is
  if (/^[a-zA-Z0-9_.:/-]*$/.test(str)) {
    return str;
  }

  // Escape backslashes and double quotes, then wrap in quotes
  const escaped = str
    .replace(/\\/g, '\\\\') // Escape backslashes first
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\n/g, '\\n') // Escape newlines
    .replace(/\r/g, '\\r'); // Escape carriage returns

  return `"${escaped}"`;
}

/** Keys that could be used for prototype pollution attacks */
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Check if a key is potentially dangerous (prototype pollution vector).
 */
export function isDangerousKey(key: string): boolean {
  return DANGEROUS_KEYS.has(key);
}

/**
 * Recursively copy an object while filtering out prototype pollution keys.
 * This performs a deep copy, checking all nested objects.
 */
export function deepSafeCopy(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj)) {
    if (isDangerousKey(k)) continue;

    const value = obj[k];
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      out[k] = deepSafeCopy(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      out[k] = value.map((item) =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
          ? deepSafeCopy(item as Record<string, unknown>)
          : item,
      );
    } else {
      out[k] = value;
    }
  }
  return out;
}
