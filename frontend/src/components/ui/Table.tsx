import { type ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';

export type SortDirection = 'asc' | 'desc' | null;

export interface TableColumn<T> {
  key: string;
  header: string;
  accessor?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  mobileHidden?: boolean;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  sortKey?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string) => void;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?: string;
}

function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === 'asc') return <ChevronUp className="w-3.5 h-3.5" />;
  if (direction === 'desc') return <ChevronDown className="w-3.5 h-3.5" />;
  return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />;
}

export function Table<T>({
  data,
  columns,
  isLoading,
  emptyTitle = 'No data found',
  emptyDescription,
  sortKey,
  sortDirection,
  onSort,
  rowKey,
  onRowClick,
  className,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('w-full overflow-x-auto rounded-lg border border-border', className)}>
      <table className="w-full text-base">
        <thead>
          <tr className="bg-surface border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-sm font-semibold text-slate-700 whitespace-nowrap',
                  col.mobileHidden && 'hidden md:table-cell',
                  col.headerClassName
                )}
              >
                {col.sortable && onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort(col.key)}
                    className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                  >
                    {col.header}
                    <SortIcon direction={sortKey === col.key ? (sortDirection ?? null) : null} />
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12">
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'bg-white hover:bg-surface/60 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-base text-slate-700',
                      col.mobileHidden && 'hidden md:table-cell',
                      col.className
                    )}
                  >
                    {col.accessor ? col.accessor(row) : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
