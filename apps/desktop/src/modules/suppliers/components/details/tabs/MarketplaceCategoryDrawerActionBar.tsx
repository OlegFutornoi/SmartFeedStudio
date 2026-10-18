import React from 'react';
import { Search, Plus, FolderInput, Download, Link2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { MarketplaceProfileMeta, ParsedMarketplaceCategoryRef } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

interface MarketplaceCategoryDrawerActionBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  activeMode: 'LIST' | 'ADD' | 'IMPORT' | 'EDIT';
  onToggleAdd: () => void;
  onToggleImport: () => void;
  onExportCsv: () => void;
  mpMeta: MarketplaceProfileMeta;
  parsedSearchUrl: ParsedMarketplaceCategoryRef | null;
}

export const MarketplaceCategoryDrawerActionBar: React.FC<
  MarketplaceCategoryDrawerActionBarProps
> = ({
  search,
  onSearchChange,
  activeMode,
  onToggleAdd,
  onToggleImport,
  onExportCsv,
  mpMeta,
  parsedSearchUrl,
}) => {
  const { t } = useTranslation(['suppliers']);

  return (
    <div className="px-5 py-3 border-b border-border/60 bg-muted/20 space-y-2 shrink-0">
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('suppliers:pickerSearchPlaceholder', {
              attr: mpMeta.xmlAttributeName,
              defaultValue: 'Пошук за назвою, кодом або URL...',
            })}
            className="pl-8 h-8 text-xs bg-background"
            data-testid="picker-search-input"
          />
        </div>
        <Button
          type="button"
          variant={activeMode === 'ADD' ? 'secondary' : 'outline'}
          size="sm"
          onClick={onToggleAdd}
          className="h-8 px-2.5 text-xs gap-1.5"
          data-testid="drawer-toggle-add-btn"
          title={t('suppliers:pickerAddCustomToggle', { defaultValue: 'Додати категорію' })}
        >
          <Plus className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant={activeMode === 'IMPORT' ? 'secondary' : 'outline'}
          size="sm"
          onClick={onToggleImport}
          className="h-8 px-2.5 text-xs gap-1.5"
          data-testid="drawer-toggle-import-btn"
          title={t('suppliers:btnImportCategoriesTooltip', {
            defaultValue: 'Імпорт категорій з файлу (CSV або JSON)',
          })}
        >
          <FolderInput className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExportCsv}
          className="h-8 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          data-testid="drawer-export-csv-btn"
          title={t('suppliers:btnExportCategoriesTooltip', {
            defaultValue: 'Експорт категорій в CSV (побачити формат)',
          })}
        >
          <Download className="size-3.5" />
        </Button>
      </div>

      {parsedSearchUrl && (
        <div
          className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-primary/10 border border-primary/20 text-xs"
          data-testid="picker-url-detected-badge"
        >
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <Link2 className="size-3.5 text-muted-foreground shrink-0" />
            {t('suppliers:pickerUrlDetectedBadge', {
              attr: parsedSearchUrl.xmlAttributeName,
              id: parsedSearchUrl.externalId,
              defaultValue: `Розпізнано ${parsedSearchUrl.xmlAttributeName}: ${parsedSearchUrl.externalId}`,
            })}
          </span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-6 px-2 text-2xs"
            onClick={onToggleAdd}
          >
            {t('suppliers:pickerAddCustomToggle', { defaultValue: '+ Додати в довідник' })}
          </Button>
        </div>
      )}
    </div>
  );
};
