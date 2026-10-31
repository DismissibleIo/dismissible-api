import { Transform } from 'class-transformer';

/**
 * Transforms string values to number, preserving existing number values.
 * Useful for environment variable configuration where number values may be passed as strings.
 * An empty string means the value was not set (eg. `${VAR:-}`), so it becomes undefined.
 *
 * @example
 * ```typescript
 * class Config {
 *   @IsNumber()
 *   @TransformNumber()
 *   maxItems!: number;
 * }
 * ```
 */
export function TransformNumber(): PropertyDecorator {
  return Transform(({ value }) => {
    if (typeof value === 'number') {
      return value;
    }
    if (value === '') {
      return undefined;
    }
    if (typeof value === 'string') {
      return Number(value);
    }
    return value;
  });
}
