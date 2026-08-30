import React from 'react';
import { Trash2, X, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';

interface ProductsBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  isDeleting?: boolean;
}

export const ProductsBulkActionsBar: React.FC<ProductsBulkActionsBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  isDeleting = false,
}) => {
  const { t } = useTranslation(['catalogs', 'common']);

  if (selectedCount === 0) return null;

  return (
    <div
      data-testid="products-bulk-actions-bar"
      className="flex items-center justify-between gap-4 p-3 bg-primary/5 border border-primary/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">
          {t('catalogs:selectedCount')}:
        </span>
        <Badge variant="default" className="bg-primary text-primary-foreground font-bold text-xs">
          {selectedCount}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          data-testid="bulk-delete-button"
          onClick={onBulkDelete}
          disabled={isDeleting}
          className="h-8 text-xs font-medium gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t('catalogs:deleteSelected')} ({selectedCount})
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-testid="clear-selection-button"
          onClick={onClearSelection}
          className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          <X className="h-3.5 w-3.5" />
          {t('catalogs:clearSelection')}
        </Button>
      </div>
    </div>
  );
};
