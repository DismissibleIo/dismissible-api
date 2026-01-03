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
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      if (value.trim().length > 0) {
        return value.split(',').map((s) => s.trim());
      } else {
        return [];
      }
    } else if (Array.isArray(value)) {
      return value;
    }
    return undefined;
  });
}
