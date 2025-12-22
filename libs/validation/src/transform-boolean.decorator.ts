import { Transform } from 'class-transformer';

/**
 * Transforms string values to boolean, preserving existing boolean values.
 * Useful for environment variable configuration where boolean values may be passed as strings.
 *
 * @param defaultValue - Optional default value to return if the value is not a boolean or string.
 *                       If not provided, the original value is returned unchanged.
 *
 * @example
 * ```typescript
 * class Config {
 *   @IsBoolean()
 *   @TransformBoolean()
 *   enabled!: boolean;
 * }
 * ```
 */
export function TransformBoolean(defaultValue?: boolean): PropertyDecorator {
  return Transform(({ value }) => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return defaultValue !== undefined ? defaultValue : value;
  });
}
