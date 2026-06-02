import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder,
      containerClassName,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full h-9 rounded-md border border-border bg-white text-base text-slate-900',
              'px-3 pr-8 appearance-none',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
              'disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60',
              error && 'border-danger focus:ring-danger/30 focus:border-danger',
              className
            )}
            aria-invalid={error ? 'true' : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
            aria-hidden="true"
          />
        </div>
        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-sm text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
