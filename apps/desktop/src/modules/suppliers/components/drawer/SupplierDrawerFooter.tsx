import React from 'react';
import { Edit2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';
import type { SupplierDto } from '@smartfeed/shared';

interface SupplierDrawerFooterProps {
  supplier: SupplierDto;
  onEdit: (supplier: SupplierDto) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const SupplierDrawerFooter: React.FC<SupplierDrawerFooterProps> = ({
  supplier,
  onEdit,
  onDelete,
  onClose,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <div
      className="p-3.5 px-5 border-t border-border/80 bg-card flex items-center justify-between gap-3 mt-auto shrink-0 shadow-xs"
      data-testid="supplier-drawer-footer"
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => onEdit(supplier)}
          data-testid="supplier-drawer-edit-btn"
        >
          <Edit2 className="size-3.5" />
          {t('common:edit', { defaultValue: 'Редагувати' })}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(supplier.id)}
          data-testid="supplier-drawer-delete-btn"
        >
          <Trash2 className="size-3.5" />
          {t('common:delete', { defaultValue: 'Видалити' })}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={onClose}
          data-testid="supplier-drawer-close-btn"
        >
          <X className="size-3.5" />
          {t('common:close', { defaultValue: 'Закрити' })}
        </Button>
      </div>
    </div>
  );
};
