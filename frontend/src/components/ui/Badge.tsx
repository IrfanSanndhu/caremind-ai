import { cn } from '@/utils/cn';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'purple'
  | 'gray';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  primary: 'bg-primary-100 text-primary-700',
  secondary: 'bg-secondary-100 text-secondary-700',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-danger-100 text-danger-700',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-slate-100 text-slate-500',
};

export function Badge({ variant = 'default', children, className, pulse = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            variant === 'warning' ? 'bg-warning-500' : variant === 'success' ? 'bg-success-500' : 'bg-primary'
          )} />
          <span className={cn(
            'relative inline-flex rounded-full h-1.5 w-1.5',
            variant === 'warning' ? 'bg-warning-500' : variant === 'success' ? 'bg-success-500' : 'bg-primary'
          )} />
        </span>
      )}
      {children}
    </span>
  );
}
