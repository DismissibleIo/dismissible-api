import { forwardRef } from 'react';
import { FormField } from './FormField';

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helpText?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  name?: string;
  type?: 'text' | 'url' | 'email';
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    { label, value, onChange, helpText, placeholder, required, error, name, type = 'text' },
    ref,
  ) => {
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
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-field"
        />
      </FormField>
    );
  },
);

TextInput.displayName = 'TextInput';
