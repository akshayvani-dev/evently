import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
  errorClassName?: string;
}

export function FormField({
  id,
  label,
  error,
  hint,
  children,
  className,
  labelClassName,
  errorClassName,
}: FormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={id}
        className={cn('block text-sm font-medium text-text', labelClassName)}
      >
        {label}
      </label>

      {children}

      {hint ? <div className="pt-0.5">{hint}</div> : null}

      {error ? (
        <p
          id={errorId}
          role="alert"
          className={cn('text-xs font-medium text-[#F0786B]', errorClassName)}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
