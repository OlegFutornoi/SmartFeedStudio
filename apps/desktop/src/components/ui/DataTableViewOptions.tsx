import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ColumnOption } from '@/hooks/useColumnVisibility';

export type { ColumnOption };

export interface DataTableViewOptionsProps<T extends string = string> {
  columnOptions: ColumnOption<T>[];
  onToggleColumn: (columnId: T, isVisible: boolean) => void;
  onResetColumns?: () => void;
  onResetDefaults?: () => void;
  isUk?: boolean;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function DataTableViewOptions<T extends string = string>({
  columnOptions,
  onToggleColumn,
  onResetColumns,
  onResetDefaults,
  isUk = true,
  align = 'end',
  className = '',
}: DataTableViewOptionsProps<T>) {
  const handleReset = onResetDefaults || onResetColumns;
  const hideableColumns = columnOptions.filter((col) => col.canHide);

  if (hideableColumns.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-testid="customize-columns-btn"
          className={`h-8 gap-1.5 text-xs bg-background/80 hover:bg-muted/80 border-border/80 px-2.5 font-normal shadow-2xs ${className}`}
          title={isUk ? 'Стовпці' : 'Columns'}
        >
          <SlidersHorizontal className="size-3.5 text-muted-foreground" />
          <span>{isUk ? 'Стовпці' : 'Columns'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        data-testid="data-table-view-options-content"
        className="w-[200px] border-border/80 bg-card/95 backdrop-blur-md shadow-md p-1"
      >
        <DropdownMenuLabel className="text-xs font-semibold px-2 py-1.5 text-foreground">
          {isUk ? 'Відображення стовпців' : 'Toggle Columns'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {hideableColumns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.isVisible}
              onCheckedChange={(checked) => onToggleColumn(column.id, !!checked)}
              onSelect={(e) => e.preventDefault()}
              data-testid={`column-toggle-${column.id}`}
              className="text-xs py-1.5 pl-8 pr-2.5 cursor-pointer focus:bg-muted"
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
        {handleReset && (
          <>
            <DropdownMenuSeparator />
            <button
              type="button"
              onClick={handleReset}
              data-testid="columns-reset-defaults-btn"
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-sm cursor-pointer transition-colors"
            >
              <RotateCcw className="size-3" />
              <span>{isUk ? 'Скинути до стандартних' : 'Reset to defaults'}</span>
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
