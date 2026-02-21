import { forwardRef } from 'react';
import { FormField } from './FormField';
import { generateInputId } from './index';

interface MultiSelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helpText?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  name?: string;
  testId?: string;
}

export const MultiSelectInput = forwardRef<HTMLInputElement, MultiSelectInputProps>(
  ({ label, value, onChange, helpText, placeholder, required, error, name, testId }, ref) => {
    const inputId = generateInputId(name, label);

    return (
      <FormField
        label={label}
        error={error}
        helpText={helpText}
        required={required}
        htmlFor={inputId}
      >
        <input
          ref={ref}
          id={inputId}
          name={name}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-field"
          data-testid={testId}
        />
        <p className="mt-2 text-xs text-white/50">Separate multiple values with commas</p>
      </FormField>
    );
  },
);

MultiSelectInput.displayName = 'MultiSelectInput';
