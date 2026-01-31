import { forwardRef } from 'react';
import { FormField } from './FormField';
import { generateInputId } from './index';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  helpText?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  name?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    { label, value, onChange, helpText, placeholder, required, error, name, min, max, step },
    ref,
  ) => {
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
          type="number"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            // Handle empty string to prevent NaN
            onChange(val === '' ? 0 : Number(val));
          }}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className="input-field"
        />
      </FormField>
    );
  },
);

NumberInput.displayName = 'NumberInput';
