import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark active:scale-[0.97] shadow-sm',
  secondary:
    'bg-secondary text-white hover:bg-secondary-600 active:scale-[0.97] shadow-sm',
  outline:
    'border border-border bg-white text-slate-900 hover:bg-surface active:scale-[0.97]',
  ghost:
    'text-slate-700 hover:bg-surface active:scale-[0.97]',
  danger:
    'bg-danger text-white hover:bg-danger-600 active:scale-[0.97] shadow-sm',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-md',
  md: 'h-9 px-4 text-base gap-2 rounded-md',
  lg: 'h-11 px-6 text-lg gap-2 rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" className={variant === 'outline' || variant === 'ghost' ? 'text-primary' : 'text-white'} />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
