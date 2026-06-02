import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-6', className)}>
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-base text-muted mt-1">{subtitle}</p>}
      </div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  );
}
