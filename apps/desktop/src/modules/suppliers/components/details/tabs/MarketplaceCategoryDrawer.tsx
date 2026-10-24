import React, { useState, useMemo, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  type MarketplaceCategoryDto,
  type CreateMarketplaceCategoryDto,
  type UpdateMarketplaceCategoryDto,
  type SupplierCategoryRuleDto,
  SUPPORTED_MARKETPLACES,
  parseMarketplaceCategoryUrl,
} from '@smartfeed/shared';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';
import { useOptionalSidebar } from '@/contexts/SidebarContext';
import { MarketplaceCategoryCustomForm } from '@/modules/suppliers/components/details/tabs/MarketplaceCategoryCustomForm';
import { MarketplaceCategoryEditForm } from '@/modules/suppliers/components/details/tabs/MarketplaceCategoryEditForm';
import { MarketplaceCategoryImportForm } from '@/modules/suppliers/components/details/tabs/MarketplaceCategoryImportForm';
import { MarketplaceCategoryDrawerRow } from '@/modules/suppliers/components/details/tabs/MarketplaceCategoryDrawerRow';
import { MarketplaceCategoryDrawerHeader } from '@/modules/suppliers/components/details/tabs/MarketplaceCategoryDrawerHeader';
import { MarketplaceCategoryDrawerFooter } from '@/modules/suppliers/components/details/tabs/MarketplaceCategoryDrawerFooter';
import { MarketplaceCategoryDrawerActionBar } from '@/modules/suppliers/components/details/tabs/MarketplaceCategoryDrawerActionBar';

interface MarketplaceCategoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierCategory: SupplierCategoryRuleDto | null;
  marketplaceCode: string;
  catalog: MarketplaceCategoryDto[];
  onSelectCategory: (item: MarketplaceCategoryDto) => Promise<void>;
  onClearMapping: () => Promise<void>;
  onCreateCategory: (payload: CreateMarketplaceCategoryDto) => Promise<MarketplaceCategoryDto>;
  onUpdateCategory: (
    id: string,
    payload: UpdateMarketplaceCategoryDto,
  ) => Promise<MarketplaceCategoryDto>;
  onImportCategories: (items: CreateMarketplaceCategoryDto[]) => Promise<{ importedCount: number }>;
}

export const MarketplaceCategoryDrawer: React.FC<MarketplaceCategoryDrawerProps> = ({
  open,
  onOpenChange,
  supplierCategory,
  marketplaceCode,
  catalog,
  onSelectCategory,
  onClearMapping,
  onCreateCategory,
  onUpdateCategory,
  onImportCategories,
}) => {
  const { t } = useTranslation(['suppliers']);
  const sidebar = useOptionalSidebar();
  const isSidebarCollapsed = sidebar?.isCollapsed ?? true;
  const [search, setSearch] = useState('');
  const [activeMode, setActiveMode] = useState<'LIST' | 'ADD' | 'IMPORT' | 'EDIT'>('LIST');
  const [editingCategory, setEditingCategory] = useState<MarketplaceCategoryDto | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const mpMeta = useMemo(
    () =>
      SUPPORTED_MARKETPLACES.find((m) => m.code === marketplaceCode) || SUPPORTED_MARKETPLACES[0],
    [marketplaceCode],
  );

  useEffect(() => {
    if (open) {
      setSearch('');
      setActiveMode('LIST');
      setEditingCategory(null);
      setIsExpanded(true);
      sidebar?.collapseSidebar();
    }
  }, [open, supplierCategory, sidebar]);

  const parsedSearchUrl = useMemo(
    () => parseMarketplaceCategoryUrl(search, marketplaceCode),
    [search, marketplaceCode],
  );

  const filteredCatalog = useMemo(() => {
    const mpItems = catalog.filter(
      (c) => c.marketplaceCode.toUpperCase() === marketplaceCode.toUpperCase(),
    );
    if (!search.trim()) return mpItems;
    const q = (parsedSearchUrl?.externalId || search.trim()).toLowerCase();
    return mpItems.filter(
      (c) =>
        c.nameUk.toLowerCase().includes(q) ||
        c.externalId.toLowerCase().includes(q) ||
        Boolean(c.fullPathUk && c.fullPathUk.toLowerCase().includes(q)),
    );
  }, [catalog, marketplaceCode, search, parsedSearchUrl]);

  const currentExternalId =
    supplierCategory?.marketplaceMappings?.[marketplaceCode]?.externalCategoryId ||
    (supplierCategory?.marketplaceCode === marketplaceCode
      ? supplierCategory?.externalCategoryId
      : null);

  const handleExportCsv = () => {
    const mpItems = catalog.filter(
      (c) => c.marketplaceCode.toUpperCase() === marketplaceCode.toUpperCase(),
    );

    const rows =
      mpItems.length > 0
        ? mpItems.map((c) => {
            const id = c.externalId || '';
            const name = (c.nameUk || '').replace(/"/g, '""');
            const comm = c.defaultCommissionPercent ?? '';
            const path = (c.fullPathUk || '').replace(/"/g, '""');
            return `${id};"${name}";${comm};"${path}"`;
          })
        : [
            '4629471;"Вимикачі світла";12;"Електромонтажне обладнання > Вимикачі"',
            '4662497;"Розумні вимикачі";12;"Розумний дім > Розумні вимикачі"',
            '4674585;"Зарядні станції";7.5;"Джерела живлення > Зарядні станції"',
            '4629470;"Розетки силові";10;"Електромонтажне обладнання > Розетки"',
          ];

    const csvContent = ['id;name;commission;path', ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `categories_${marketplaceCode.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const expandedWidthClass = isSidebarCollapsed
    ? 'w-full md:w-[calc(100vw-72px)] max-w-none'
    : 'w-full md:w-[calc(100vw-16rem)] max-w-none';

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        hideOverlay={true}
        hideCloseButton={false}
        className={cn(
          'p-0 flex flex-col h-full bg-background border-l border-border/80 shadow-2xl z-[60] overflow-hidden outline-none ring-0 transition-all duration-300 ease-in-out',
          isExpanded
            ? expandedWidthClass
            : 'w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl',
        )}
        data-testid="marketplace-category-drawer"
      >
        <MarketplaceCategoryDrawerHeader
          mpMeta={mpMeta}
          supplierCategory={supplierCategory}
          isExpanded={isExpanded}
          onToggleExpand={() =>
            setIsExpanded((prev) => {
              const next = !prev;
              if (next) sidebar?.collapseSidebar();
              return next;
            })
          }
        />

        <MarketplaceCategoryDrawerActionBar
          search={search}
          onSearchChange={setSearch}
          activeMode={activeMode}
          onToggleAdd={() => setActiveMode(activeMode === 'ADD' ? 'LIST' : 'ADD')}
          onToggleImport={() => setActiveMode(activeMode === 'IMPORT' ? 'LIST' : 'IMPORT')}
          onExportCsv={handleExportCsv}
          mpMeta={mpMeta}
          parsedSearchUrl={parsedSearchUrl}
        />

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {activeMode === 'ADD' && (
            <MarketplaceCategoryCustomForm
              defaultName=""
              defaultIdOrUrl={parsedSearchUrl?.externalId || ''}
              marketplaceCode={marketplaceCode}
              xmlAttributeName={mpMeta.xmlAttributeName}
              onCreateAndSelect={async (payload) => {
                const created = await onCreateCategory(payload);
                await onSelectCategory(created);
                setActiveMode('LIST');
                onOpenChange(false);
                return created;
              }}
            />
          )}

          {activeMode === 'IMPORT' && (
            <MarketplaceCategoryImportForm
              marketplaceCode={marketplaceCode}
              xmlAttributeName={mpMeta.xmlAttributeName}
              onImport={async (items) => {
                const res = await onImportCategories(items);
                setActiveMode('LIST');
                return res;
              }}
              onCancel={() => setActiveMode('LIST')}
            />
          )}

          {activeMode === 'EDIT' && editingCategory && (
            <MarketplaceCategoryEditForm
              category={editingCategory}
              onSave={async (id, patch) => {
                await onUpdateCategory(id, patch);
                setActiveMode('LIST');
                setEditingCategory(null);
              }}
              onCancel={() => {
                setActiveMode('LIST');
                setEditingCategory(null);
              }}
            />
          )}

          {/* Catalog Categories List */}
          <div className="border border-border/70 rounded-lg divide-y divide-border/50 bg-background/50 overflow-hidden">
            {filteredCatalog.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                {t('suppliers:pickerNoResults', {
                  defaultValue: 'У довіднику не знайдено категорій за запитом',
                })}
              </div>
            ) : (
              filteredCatalog.map((item) => (
                <MarketplaceCategoryDrawerRow
                  key={`${item.marketplaceCode}_${item.externalId}`}
                  item={item}
                  isSelected={currentExternalId === item.externalId}
                  onSelect={async (selected) => {
                    await onSelectCategory(selected);
                    onOpenChange(false);
                  }}
                  onEdit={(target) => {
                    setEditingCategory(target);
                    setActiveMode('EDIT');
                  }}
                />
              ))
            )}
          </div>
        </div>

        <MarketplaceCategoryDrawerFooter
          currentExternalId={currentExternalId}
          totalCategories={filteredCatalog.length}
          onClearMapping={onClearMapping}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
};
