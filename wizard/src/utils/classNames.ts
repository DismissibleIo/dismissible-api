/**
 * Utility to conditionally join classNames together.
 * Filters out falsy values.
 */
export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
