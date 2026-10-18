import React from 'react';
import { Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { MarketplaceCategoryDto } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

interface MarketplaceCategoryDrawerRowProps {
  item: MarketplaceCategoryDto;
  isSelected: boolean;
  onSelect: (item: MarketplaceCategoryDto) => void;
  onEdit: (item: MarketplaceCategoryDto) => void;
}

export const MarketplaceCategoryDrawerRow: React.FC<MarketplaceCategoryDrawerRowProps> = ({
  item,
  isSelected,
  onSelect,
  onEdit,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <div
      className={`px-3 py-2 flex items-center justify-between gap-2.5 transition-colors hover:bg-muted/60 ${
        isSelected ? 'bg-primary/5' : ''
      }`}
      data-testid={`drawer-item-container-${item.externalId}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-foreground truncate">{item.nameUk}</span>
          <Badge
            variant="outline"
            className="font-mono text-2xs px-1.5 py-0 h-4.5 shrink-0 tabular-nums"
          >
            {item.xmlAttributeName}: {item.externalId}
          </Badge>
        </div>
        {item.fullPathUk && (
          <p className="text-2xs text-muted-foreground truncate mt-0.5">{item.fullPathUk}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Badge
          variant="secondary"
          className="font-mono text-2xs px-1.5 py-0 h-5 tabular-nums text-foreground/90"
        >
          {item.defaultCommissionPercent}%
        </Badge>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEdit(item)}
          className="size-7 p-0 text-muted-foreground hover:text-foreground"
          title={t('suppliers:btnEditCategory', { defaultValue: 'Редагувати категорію' })}
          data-testid={`edit-item-${item.externalId}`}
          aria-label={t('suppliers:btnEditCategory', { defaultValue: 'Редагувати категорію' })}
        >
          <Pencil className="size-3.5" />
        </Button>

        <Button
          type="button"
          variant={isSelected ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(item)}
          className="h-7 px-2 text-2xs font-medium gap-1"
          data-testid={`picker-item-${item.externalId}`}
        >
          {isSelected ? (
            <>
              <Check className="size-3" />
              <span>{t('suppliers:pickerSelectedBadge', { defaultValue: 'Обрано' })}</span>
            </>
          ) : (
            <span>{t('suppliers:pickerSelectBtn', { defaultValue: 'Обрати' })}</span>
          )}
        </Button>
      </div>
    </div>
  );
};
