import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

interface MarketplaceCategoryDrawerFooterProps {
  currentExternalId: string | null | undefined;
  totalCategories: number;
  onClearMapping: () => Promise<void>;
  onClose: () => void;
}

export const MarketplaceCategoryDrawerFooter: React.FC<MarketplaceCategoryDrawerFooterProps> = ({
  currentExternalId,
  totalCategories,
  onClearMapping,
  onClose,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <div className="sticky bottom-0 bg-card z-10 px-5 py-2.5 border-t border-border/80 flex items-center justify-between gap-2 shrink-0">
      {currentExternalId ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1"
          onClick={async () => {
            await onClearMapping();
            onClose();
          }}
          data-testid="picker-clear-mapping-btn"
        >
          <X className="size-3" />
          {t('suppliers:pickerClearMappingBtn', { defaultValue: 'Очистити привʼязку' })}
        </Button>
      ) : (
        <span className="text-2xs text-muted-foreground">
          {totalCategories} {t('suppliers:columnCategories', { defaultValue: 'категорій' })}
        </span>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClose}
        className="h-7 text-xs"
        data-testid="drawer-close-btn"
      >
        {t('common:close', { defaultValue: 'Закрити' })}
      </Button>
    </div>
  );
};
