import React from 'react';
import { Building2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SupplierDto } from '@smartfeed/shared';

interface QuotaSuppliersTabProps {
  suppliers: SupplierDto[];
  deletingIds: Set<string>;
  isUk: boolean;
  onDeleteSupplier: (supplier: SupplierDto) => void;
}

export const QuotaSuppliersTab: React.FC<QuotaSuppliersTabProps> = ({
  suppliers,
  deletingIds,
  isUk,
  onDeleteSupplier,
}) => {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {isUk
          ? 'Видалення постачальника видаляє його фіди та товари.'
          : 'Deleting a supplier removes their feeds and all products.'}
      </p>

      <div className="space-y-2">
        {suppliers.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-xl text-muted-foreground text-xs">
            <Building2 className="h-6 w-6 mx-auto mb-2 opacity-50" />
            {isUk ? 'Немає постачальників' : 'No suppliers'}
          </div>
        ) : (
          suppliers.map((sup) => {
            const isItemDeleting = deletingIds.has(sup.id);

            return (
              <div
                key={sup.id}
                className={`p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-all flex items-center justify-between gap-3 shadow-sm ${
                  isItemDeleting ? 'opacity-60 bg-muted/30' : ''
                }`}
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="font-semibold text-xs text-foreground truncate">
                      {sup.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono uppercase bg-background px-1.5 py-0"
                    >
                      {sup.code}
                    </Badge>
                    {isItemDeleting && (
                      <Badge
                        variant="destructive"
                        className="text-[10px] animate-pulse px-1.5 py-0"
                      >
                        {isUk ? 'Видаляється...' : 'Deleting...'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isUk
                      ? `Товарів: ${sup.productsCount || 0} SKU • Фідів: ${sup.activeFeedsCount || 0}`
                      : `Products: ${sup.productsCount || 0} SKU • Feeds: ${sup.activeFeedsCount || 0}`}
                  </p>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  disabled={isItemDeleting}
                  onClick={() => onDeleteSupplier(sup)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0 transition-colors"
                  title={
                    isUk
                      ? 'Видалити постачальника та всі його товари'
                      : 'Delete supplier and all products'
                  }
                  aria-label={isUk ? 'Видалити постачальника' : 'Delete supplier'}
                  data-testid={`delete-supplier-btn-${sup.id}`}
                >
                  {isItemDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
