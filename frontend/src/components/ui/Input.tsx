import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leadingIcon,
      trailingIcon,
      containerClassName,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leadingIcon && (
            <div className="absolute left-3 text-muted pointer-events-none">{leadingIcon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-9 rounded-md border border-border bg-white text-base text-slate-900',
              'placeholder:text-muted',
              'px-3 py-2',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
              'disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60',
              error && 'border-danger focus:ring-danger/30 focus:border-danger',
              leadingIcon && 'pl-9',
              trailingIcon && 'pr-9',
              className
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-hint` : undefined}
            {...props}
          />
          {trailingIcon && (
            <div className="absolute right-3 text-muted">{trailingIcon}</div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-hint`} className="text-sm text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
