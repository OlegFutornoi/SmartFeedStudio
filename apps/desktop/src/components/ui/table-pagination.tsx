'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  isUk?: boolean;
  className?: string;
  testIdPrefix?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  isUk = true,
  className = '',
  testIdPrefix = 'table-pagination',
}) => {
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  // Generate pagination items with smart ellipsis
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items: (number | 'ellipsis-left' | 'ellipsis-right')[] = [];

    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) {
        items.push(i);
      }
      items.push('ellipsis-right');
      items.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      items.push(1);
      items.push('ellipsis-left');
      for (let i = totalPages - 4; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      items.push(1);
      items.push('ellipsis-left');
      items.push(currentPage - 1);
      items.push(currentPage);
      items.push(currentPage + 1);
      items.push('ellipsis-right');
      items.push(totalPages);
    }

    return items;
  }, [currentPage, totalPages]);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      data-testid={testIdPrefix}
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/60 bg-muted/10 text-xs ${className}`}
    >
      {/* Left side: range summary and optional page size selector */}
      <div className="flex flex-wrap items-center gap-3 text-muted-foreground w-full sm:w-auto justify-between sm:justify-start">
        <span data-testid={`${testIdPrefix}-range-text`} className="font-medium text-foreground/80">
          {isUk
            ? `Показано ${from}–${to} із ${totalItems} записів`
            : `Showing ${from}–${to} of ${totalItems} records`}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
            <span className="text-[11px] text-muted-foreground hidden md:inline">
              {isUk ? 'Рядків:' : 'Rows:'}
            </span>
            <Select value={String(pageSize)} onValueChange={(val) => onPageSizeChange(Number(val))}>
              <SelectTrigger
                data-testid={`${testIdPrefix}-size-select`}
                className="h-7 w-[70px] text-xs px-2 font-medium bg-background"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Right side: navigation controls */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
        {/* First page */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 rounded-md"
          data-testid={`${testIdPrefix}-first-btn`}
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          title={isUk ? 'Перша сторінка' : 'First page'}
        >
          <ChevronsLeft className="size-3.5" />
          <span className="sr-only">{isUk ? 'Перша сторінка' : 'First page'}</span>
        </Button>

        {/* Previous page */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 rounded-md"
          data-testid={`${testIdPrefix}-prev-btn`}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title={isUk ? 'Попередня сторінка' : 'Previous page'}
        >
          <ChevronLeft className="size-3.5" />
          <span className="sr-only">{isUk ? 'Попередня сторінка' : 'Previous page'}</span>
        </Button>

        {/* Numbered buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((item, idx) => {
            if (item === 'ellipsis-left' || item === 'ellipsis-right') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 py-1 text-muted-foreground text-xs select-none"
                >
                  …
                </span>
              );
            }

            const isActive = item === currentPage;
            return (
              <Button
                key={`page-${item}`}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className={`h-7 min-w-7 px-2 text-xs rounded-md transition-all ${
                  isActive
                    ? 'font-semibold pointer-events-none shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
                data-testid={`${testIdPrefix}-page-${item}-btn`}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            );
          })}
        </div>

        {/* Next page */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 rounded-md"
          data-testid={`${testIdPrefix}-next-btn`}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title={isUk ? 'Наступна сторінка' : 'Next page'}
        >
          <ChevronRight className="size-3.5" />
          <span className="sr-only">{isUk ? 'Наступна сторінка' : 'Next page'}</span>
        </Button>

        {/* Last page */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 rounded-md"
          data-testid={`${testIdPrefix}-last-btn`}
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          title={isUk ? 'Остання сторінка' : 'Last page'}
        >
          <ChevronsRight className="size-3.5" />
          <span className="sr-only">{isUk ? 'Остання сторінка' : 'Last page'}</span>
        </Button>
      </div>
    </div>
  );
};
