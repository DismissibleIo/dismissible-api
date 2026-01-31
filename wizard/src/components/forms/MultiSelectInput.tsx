import { forwardRef } from 'react';
import { FormField } from './FormField';

interface MultiSelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helpText?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  name?: string;
}

export const MultiSelectInput = forwardRef<HTMLInputElement, MultiSelectInputProps>(
  ({ label, value, onChange, helpText, placeholder, required, error, name }, ref) => {
    const inputId = name || label.toLowerCase().replace(/\s+/g, '-');

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
        />
        <p className="mt-2 text-xs text-gray-400">Separate multiple values with commas</p>
      </FormField>
    );
  },
);

MultiSelectInput.displayName = 'MultiSelectInput';
