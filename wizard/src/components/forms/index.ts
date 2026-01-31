/**
 * Generate a unique input ID from a name or label.
 * Used consistently across all form input components.
 */
export function generateInputId(name?: string, label?: string): string {
  return name || (label ? label.toLowerCase().replace(/\s+/g, '-') : '');
}

export { FormField } from './FormField';
export { HelpTooltip } from './HelpTooltip';
export { TextInput } from './TextInput';
export { NumberInput } from './NumberInput';
export { SelectInput } from './SelectInput';
export { ToggleInput } from './ToggleInput';
export { PasswordInput } from './PasswordInput';
export { MultiSelectInput } from './MultiSelectInput';
