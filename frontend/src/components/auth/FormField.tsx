import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FormField({
  id,
  label,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-text"
      >
        {label}
      </label>

      {children}

      {hint ? <div className="pt-0.5">{hint}</div> : null}

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-[#F0786B]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
