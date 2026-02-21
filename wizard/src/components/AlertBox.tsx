import { ReactNode } from 'react';

interface AlertBoxProps {
  variant: 'info' | 'warning' | 'error';
  children: ReactNode;
}

const variantStyles = {
  info: 'bg-primary-500/10 border-primary-500/30 text-primary-400',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  error: 'bg-red-500/10 border-red-500/30 text-red-400',
};

export function AlertBox({ variant, children }: AlertBoxProps) {
  return <div className={`mt-4 p-4 border rounded-md ${variantStyles[variant]}`}>{children}</div>;
}
