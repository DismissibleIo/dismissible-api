import { ReactNode } from 'react';

interface AlertBoxProps {
  variant: 'info' | 'warning' | 'error';
  children: ReactNode;
}

const variantStyles = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
};

export function AlertBox({ variant, children }: AlertBoxProps) {
  return <div className={`mt-4 p-4 border rounded-md ${variantStyles[variant]}`}>{children}</div>;
}
