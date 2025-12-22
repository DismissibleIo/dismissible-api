import { Transform } from 'class-transformer';

/**
 * Transforms a comma-separated string into an array of trimmed strings.
 * If the value is already an array, it is returned as-is.
 *
 * @example
 * // Input: "GET,POST,DELETE" → Output: ["GET", "POST", "DELETE"]
 * // Input: "a , b , c" → Output: ["a", "b", "c"]
 * // Input: ["a", "b"] → Output: ["a", "b"]
 */
export function TransformCommaSeparated(): PropertyDecorator {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((s) => s.trim()) : value,
  );
}
