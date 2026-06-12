import { ReactNode, cloneElement, isValidElement, Children } from 'react';
import { HelpTooltip } from './HelpTooltip';

interface FormFieldProps {
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
}

export function FormField({ label, error, helpText, required, children, htmlFor }: FormFieldProps) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  const helpId = htmlFor && helpText ? `${htmlFor}-help` : undefined;

  // Add aria-describedby to child input if we have an error or help text
  const enhancedChildren = Children.map(children, (child) => {
    if (isValidElement(child) && (error || helpText)) {
      const describedBy = [errorId && error ? errorId : null, helpId].filter(Boolean).join(' ');
      if (describedBy) {
        return cloneElement(
          child as React.ReactElement<{ 'aria-describedby'?: string; 'aria-invalid'?: boolean }>,
          {
            'aria-describedby': describedBy,
            'aria-invalid': !!error,
          },
        );
      }
    }
    return child;
  });

  return (
    <div className="mb-6">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-white/90 mb-2">
        {label}
        {required && (
          <span className="text-red-400 ml-1" aria-hidden="true">
            *
          </span>
        )}
        {helpText && <HelpTooltip text={helpText} id={helpId} />}
      </label>
      {enhancedChildren}
      {error && (
        <p id={errorId} className="mt-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
