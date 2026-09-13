import React from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TabType } from '@/hooks/useQuotaReconciliation';

interface QuotaReconciliationFooterProps {
  activeTab: TabType;
  selectedCategoryIds: string[];
  isUk: boolean;
  projectedRemainingProducts: number;
  isProjectedValid: boolean;
  isBulkDeleting: boolean;
  selectedProductsToDeleteCount: number;
  onClose: () => void;
  onDeleteSelected: () => void;
}

export const QuotaReconciliationFooter: React.FC<QuotaReconciliationFooterProps> = ({
  activeTab,
  selectedCategoryIds,
  isUk,
  projectedRemainingProducts,
  isProjectedValid,
  isBulkDeleting,
  selectedProductsToDeleteCount,
  onClose,
  onDeleteSelected,
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card z-10 shrink-0">
      {activeTab === 'CATEGORIES' && selectedCategoryIds.length > 0 ? (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">{isUk ? 'Після видалення:' : 'After:'}</span>
          <span
            className={`font-mono font-bold ${
              isProjectedValid ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {projectedRemainingProducts.toLocaleString()} SKU
          </span>
          {isProjectedValid && (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]"
            >
              {isUk ? 'В межах ліміту' : 'Within limit'}
            </Badge>
          )}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          {isUk ? 'Узгодьте дані для розблокування' : 'Reconcile data to unlock'}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl h-9 text-xs">
          {isUk ? 'Закрити' : 'Close'}
        </Button>

        {activeTab === 'CATEGORIES' && selectedCategoryIds.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            data-testid="bulk-delete-categories-btn"
            disabled={isBulkDeleting}
            onClick={onDeleteSelected}
            className="rounded-xl h-9 text-xs gap-1.5 font-semibold"
          >
            {isBulkDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
            {isUk
              ? `Видалити ${selectedCategoryIds.length} категорій (-${selectedProductsToDeleteCount.toLocaleString()} SKU)`
              : `Delete ${selectedCategoryIds.length} categories (-${selectedProductsToDeleteCount.toLocaleString()} SKU)`}
          </Button>
        )}
      </div>
    </div>
  );
};
