import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, containerClassName, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-slate-700">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full rounded-md border border-border bg-white text-base text-slate-900',
            'placeholder:text-muted',
            'px-3 py-2 min-h-[80px]',
            'transition-all duration-200 resize-y',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            'disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60',
            error && 'border-danger focus:ring-danger/30 focus:border-danger',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${textareaId}-hint`} className="text-sm text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
