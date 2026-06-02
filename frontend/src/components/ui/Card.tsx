import { cn } from '@/utils/cn';
import { type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevated?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({
  children,
  className,
  padding = 'md',
  elevated = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-lg border border-border',
        elevated ? 'shadow-elevated' : 'shadow-card',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action, children, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-4', className)} {...props}>
      <div>
        {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  );
}
