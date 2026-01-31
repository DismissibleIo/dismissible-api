import { forwardRef } from 'react';
import { Listbox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/solid';
import { FormField } from './FormField';
import { generateInputId } from './index';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[] | string[];
  helpText?: string;
  required?: boolean;
  error?: string;
  name?: string;
}

export const SelectInput = forwardRef<HTMLButtonElement, SelectInputProps>(
  ({ label, value, onChange, options, helpText, required, error, name }, ref) => {
    const inputId = generateInputId(name, label);

    const normalizedOptions: SelectOption[] = options.map((opt) =>
      typeof opt === 'string' ? { value: opt, label: opt } : opt,
    );

    const selectedOption = normalizedOptions.find((opt) => opt.value === value);

    return (
      <FormField
        label={label}
        error={error}
        helpText={helpText}
        required={required}
        htmlFor={inputId}
      >
        <Listbox value={value} onChange={onChange}>
          <div className="relative">
            <Listbox.Button
              ref={ref}
              id={inputId}
              className="input-field relative w-full cursor-default text-left"
            >
              <span className="block truncate">{selectedOption?.label || 'Select an option'}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Listbox.Options className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-lg bg-dark-600 border border-dark-500 py-1 shadow-xl focus:outline-none">
              {normalizedOptions.map((option) => (
                <Listbox.Option
                  key={option.value}
                  value={option.value}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors ${
                      active ? 'bg-dark-500 text-white' : 'text-gray-300'
                    }`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium text-white' : 'font-normal'
                        }`}
                      >
                        {option.label}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-500">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
      </FormField>
    );
  },
);

SelectInput.displayName = 'SelectInput';
