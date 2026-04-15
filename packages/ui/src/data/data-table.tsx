import * as React from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '../lib/utils';
import { Skeleton } from '../primitives/skeleton';

export type Column<T> = {
  key: string;
  header: string;
  width?: string;
  render: (item: T) => React.ReactNode;
  sortable?: boolean;
  hideOnMobile?: boolean;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  rowActions?: (item: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  loading?: boolean;
  loadingRows?: number;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  className?: string;
};

function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  rowActions,
  emptyState,
  loading = false,
  loadingRows = 5,
  sortKey,
  sortDirection,
  onSort,
  className,
}: DataTableProps<T>) {
  const totalCols = rowActions ? columns.length + 1 : columns.length;

  return (
    <table className={cn('w-full border-collapse', className)}>
      <thead>
        <tr className="border-b border-border">
          {columns.map(col => (
            <th
              key={col.key}
              style={col.width ? { width: col.width } : undefined}
              className={cn(
                'px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-foreground-dim',
                col.sortable && onSort && 'cursor-pointer select-none',
                col.hideOnMobile && 'hidden sm:table-cell'
              )}
              onClick={
                col.sortable && onSort ? () => onSort(col.key) : undefined
              }
            >
              <span className="inline-flex items-center gap-1">
                {col.header}
                {col.sortable && onSort && (
                  <span className="inline-flex flex-col">
                    {sortKey === col.key && sortDirection === 'asc' ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : sortKey === col.key && sortDirection === 'desc' ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronUp className="h-3 w-3 opacity-30" />
                    )}
                  </span>
                )}
              </span>
            </th>
          ))}
          {rowActions && <th className="w-[1%] px-3 py-2" />}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          Array.from({ length: loadingRows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b border-border-subtle">
              {columns.map(col => (
                <td
                  key={col.key}
                  className={cn(
                    'px-3 py-2.5',
                    col.hideOnMobile && 'hidden sm:table-cell'
                  )}
                >
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
              {rowActions && (
                <td className="px-3 py-2.5">
                  <Skeleton className="h-4 w-full" />
                </td>
              )}
            </tr>
          ))
        ) : data.length === 0 ? (
          <tr>
            <td
              colSpan={totalCols}
              className="px-3 py-10 text-center text-[12px] text-foreground-ghost"
            >
              {emptyState ?? 'No data'}
            </td>
          </tr>
        ) : (
          data.map(item => (
            <tr
              key={keyExtractor(item)}
              className={cn(
                'group border-b border-border-subtle transition-colors duration-120 hover:bg-card',
                onRowClick && 'cursor-pointer'
              )}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className={cn(
                    'px-3 py-2.5 text-[12px] text-foreground-muted',
                    col.hideOnMobile && 'hidden sm:table-cell'
                  )}
                >
                  {col.render(item)}
                </td>
              ))}
              {rowActions && (
                <td className="px-3 py-2.5 text-right opacity-0 transition-opacity duration-120 group-hover:opacity-100">
                  {rowActions(item)}
                </td>
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export { DataTable };
export type { DataTableProps };
