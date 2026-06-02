import { cn } from '@/utils/cn';
import { getInitials } from '@/utils';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-9 h-9 text-base',
  lg: 'w-11 h-11 text-lg',
  xl: 'w-14 h-14 text-xl',
};

const colors = [
  'bg-primary-100 text-primary-700',
  'bg-secondary-100 text-secondary-700',
  'bg-success-100 text-success-700',
  'bg-warning-100 text-warning-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
];

function getColor(name = ''): string {
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx] ?? colors[0];
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'User avatar'}
        className={cn('rounded-full object-cover flex-shrink-0', sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold flex-shrink-0',
        sizeClasses[size],
        getColor(name),
        className
      )}
      aria-label={name ?? 'User'}
    >
      {getInitials(name ?? '?')}
    </div>
  );
}
