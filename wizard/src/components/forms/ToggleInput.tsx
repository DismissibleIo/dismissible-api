import { forwardRef } from 'react';
import { Switch } from '@headlessui/react';
import { FormField } from './FormField';
import { generateInputId } from './index';

interface ToggleInputProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  helpText?: string;
  error?: string;
  name?: string;
}

export const ToggleInput = forwardRef<HTMLButtonElement, ToggleInputProps>(
  ({ label, value, onChange, helpText, error, name }, ref) => {
    const inputId = generateInputId(name, label);

    return (
      <FormField label={label} error={error} helpText={helpText} htmlFor={inputId}>
        <Switch
          ref={ref}
          checked={value}
          onChange={onChange}
          className={`${
            value ? 'bg-primary-600' : 'bg-dark-500'
          } relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-700 shadow-inner`}
        >
          <span className="sr-only">{label}</span>
          <span
            className={`${
              value ? 'translate-x-8' : 'translate-x-1'
            } inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform`}
          />
        </Switch>
      </FormField>
    );
  },
);

ToggleInput.displayName = 'ToggleInput';
