import { cn } from '@/utils/cn';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:400%_100%]',
            'rounded-md',
            className
          )}
          style={{
            animationName: 'shimmer',
            animationDuration: '1.5s',
            animationIterationCount: 'infinite',
          }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-border p-5 shadow-card animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
