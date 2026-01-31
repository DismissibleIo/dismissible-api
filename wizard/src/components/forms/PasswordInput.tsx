import { forwardRef, useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { FormField } from './FormField';
import { generateInputId } from './index';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helpText?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  name?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, value, onChange, helpText, placeholder, required, error, name }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = generateInputId(name, label);

    return (
      <FormField
        label={label}
        error={error}
        helpText={helpText}
        required={required}
        htmlFor={inputId}
      >
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="input-field pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <EyeIcon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </FormField>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
