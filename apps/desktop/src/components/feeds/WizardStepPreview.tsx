import { useState, useMemo } from 'react';
import { FeedAnalysisResult } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Layers, ShoppingBag, Search, CheckSquare, Square, Sparkles, Check } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { WizardSampleProductsTable } from '@/components/feeds/WizardSampleProductsTable';

interface WizardStepPreviewProps {
  analysis: FeedAnalysisResult;
  selectedCategoryIds: string[];
  setSelectedCategoryIds: (ids: string[]) => void;
  remainingQuota: number;
  isUnlimited?: boolean;
}

export function WizardStepPreview({
  analysis,
  selectedCategoryIds,
  setSelectedCategoryIds,
  remainingQuota,
  isUnlimited = false,
}: WizardStepPreviewProps) {
  const { t } = useTranslation(['suppliers', 'common']);
  const [categorySearch, setCategorySearch] = useState('');

  const categories = useMemo(() => analysis.categories || [], [analysis.categories]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const query = categorySearch.toLowerCase().trim();
    return categories.filter((c) => c.name.toLowerCase().includes(query));
  }, [categories, categorySearch]);

  const totalSelectedSkus = useMemo(() => {
    if (categories.length === 0) return analysis.totalDetected;
    if (selectedCategoryIds.length === 0) return 0;
    const selectedSet = new Set(selectedCategoryIds);
    return categories
      .filter((c) => selectedSet.has(c.id))
      .reduce((sum, c) => sum + (c.productCount || 0), 0);
  }, [categories, selectedCategoryIds, analysis.totalDetected]);

  const isQuotaExceeded = !isUnlimited && totalSelectedSkus > remainingQuota;
  const quotaPercent = isUnlimited
    ? 0
    : Math.min(100, Math.round((totalSelectedSkus / (remainingQuota || 1)) * 100));

  const handleSelectAll = () => setSelectedCategoryIds(categories.map((c) => c.id));
  const handleDeselectAll = () => setSelectedCategoryIds([]);

  const handleAutoFitToQuota = () => {
    if (isUnlimited || categories.length === 0) return;
    let currentSum = 0;
    const fittingIds: string[] = [];
    for (const cat of categories) {
      const count = cat.productCount || 0;
      if (currentSum + count <= remainingQuota) {
        fittingIds.push(cat.id);
        currentSum += count;
      }
    }
    if (fittingIds.length === 0 && categories.length > 0) {
      const sortedByAsc = [...categories].sort(
        (a, b) => (a.productCount || 0) - (b.productCount || 0),
      );
      if ((sortedByAsc[0]?.productCount || 0) <= remainingQuota) {
        fittingIds.push(sortedByAsc[0].id);
      }
    }
    setSelectedCategoryIds(fittingIds);
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(
      selectedCategoryIds.includes(id)
        ? selectedCategoryIds.filter((catId) => catId !== id)
        : [...selectedCategoryIds, id],
    );
  };

  return (
    <div className="space-y-3">
      {/* Top Telemetry & Quota Strip */}
      <div className="px-3.5 py-2.5 rounded-lg border border-border/60 bg-card flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="text-2xs font-mono bg-muted/40 border-border/60">
            {t('suppliers:detectedFormat', { defaultValue: 'Формат фіду' })}: {analysis.format}
          </Badge>
          <div className="h-3.5 w-px bg-border/60 hidden sm:block" />
          <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <ShoppingBag className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">
              {t('suppliers:totalProductsFound', { defaultValue: 'Знайдено товарів' })}:
            </span>
            <strong className="font-mono tabular-nums font-semibold">
              {analysis.totalDetected.toLocaleString('uk-UA')} SKU
            </strong>
          </div>
          <div className="h-3.5 w-px bg-border/60 hidden sm:block" />
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Layers className="size-3.5 text-muted-foreground" />
            <strong className="font-mono tabular-nums text-foreground font-semibold">
              {analysis.categoriesCount}
            </strong>
            <span>{t('suppliers:categoriesFound', { defaultValue: 'Категорій' })}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto flex-wrap">
          <div className="space-y-1 text-right">
            <div className="text-xs font-medium flex items-center justify-end gap-1.5">
              <span className="text-muted-foreground">
                {t('suppliers:selectedToImport', { defaultValue: 'Обрано до імпорту:' })}
              </span>
              <strong
                className={`font-mono tabular-nums ${isQuotaExceeded ? 'text-destructive font-bold' : 'text-foreground font-semibold'}`}
              >
                {totalSelectedSkus.toLocaleString('uk-UA')}
              </strong>
              <span className="text-muted-foreground font-mono tabular-nums">
                / {isUnlimited ? '∞' : `${remainingQuota.toLocaleString('uk-UA')} SKU`}
              </span>
            </div>
            <div className="w-36 sm:w-44 h-1.5 rounded-full bg-muted overflow-hidden ml-auto">
              <div
                className={`h-full transition-all duration-300 ${isQuotaExceeded ? 'bg-destructive' : 'bg-foreground/75'}`}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
          </div>

          {selectedCategoryIds.length === 0 ? (
            <Badge
              variant="outline"
              className="border-border bg-muted text-muted-foreground text-3xs font-medium px-2 py-0.5"
            >
              {t('suppliers:noCategoriesSelected', {
                defaultValue: 'Оберіть хоча б одну категорію для імпорту',
              })}
            </Badge>
          ) : isQuotaExceeded ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-3xs font-semibold text-destructive leading-tight">
                  {t('suppliers:quotaExceededTitle', {
                    defaultValue: 'Перевищено ліміт товарів тарифу',
                  })}
                </span>
                <Badge
                  variant="outline"
                  className="border-destructive/40 bg-destructive/10 text-destructive text-3xs font-mono tabular-nums font-semibold px-1.5 py-0 mt-0.5"
                >
                  {t('suppliers:quotaExceededShort', {
                    count: (totalSelectedSkus - remainingQuota).toLocaleString('uk-UA'),
                    defaultValue: `Перевищено на ${(totalSelectedSkus - remainingQuota).toLocaleString('uk-UA')} SKU`,
                  })}
                </Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoFitToQuota}
                className="h-7 text-2xs px-2.5 gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                title={t('suppliers:autoFitToQuotaTooltip', {
                  defaultValue: 'Автоматично обрати категорії у межах ліміту',
                })}
              >
                <Sparkles className="size-3" />
                <span>
                  {t('suppliers:autoFitToQuota', { defaultValue: 'Підігнати під ліміт' })}
                </span>
              </Button>
            </div>
          ) : (
            <Badge
              variant="outline"
              className="border-success/30 bg-success/10 text-success text-3xs font-medium px-2 py-0.5"
            >
              ✓ {t('suppliers:withinQuota', { defaultValue: 'В межах ліміту' })}
            </Badge>
          )}
        </div>
      </div>

      {/* Categories Matrix Card */}
      {categories.length > 0 && (
        <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
          <div className="px-3.5 py-2 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-2.5 flex-wrap">
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-muted-foreground" />
              <span>
                {t('suppliers:selectCategoriesToImport', {
                  defaultValue: 'Оберіть категорії для імпорту:',
                })}
              </span>
              <span className="text-muted-foreground font-mono font-normal text-2xs tabular-nums">
                {t('suppliers:selectedCategoriesRatio', {
                  selected: selectedCategoryIds.length,
                  total: categories.length,
                  defaultValue: `(${selectedCategoryIds.length} з ${categories.length} обрано)`,
                })}
              </span>
            </div>

            <div className="flex items-center gap-1.5 ml-auto flex-wrap">
              {categories.length > 4 && (
                <div className="relative w-48 sm:w-56">
                  <Search className="size-3 absolute left-2.5 top-2 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder={t('suppliers:searchCategoryPlaceholder', {
                      defaultValue: 'Пошук серед категорій фіду…',
                    })}
                    value={categorySearch}
                    spellCheck={false}
                    autoComplete="off"
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="h-7 pl-7 pr-2 text-2xs bg-background border-border"
                  />
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-2xs px-2 flex items-center gap-1 bg-background border-border"
                onClick={handleSelectAll}
              >
                <CheckSquare className="size-3 text-muted-foreground" />
                {t('suppliers:selectAll', { defaultValue: 'Обрати всі' })}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-2xs px-2 flex items-center gap-1 text-muted-foreground hover:text-foreground"
                onClick={handleDeselectAll}
              >
                <Square className="size-3" />
                {t('suppliers:deselectAll', { defaultValue: 'Зняти всі' })}
              </Button>
            </div>
          </div>

          <div className="p-2.5 max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 bg-background/40">
            {filteredCategories.map((cat) => {
              const isSelected = selectedCategoryIds.includes(cat.id);
              return (
                <Button
                  key={cat.id}
                  type="button"
                  variant="outline"
                  onClick={() => toggleCategory(cat.id)}
                  className={`h-auto justify-between px-2.5 py-2 rounded-md text-left text-xs font-normal transition-colors ${
                    isSelected
                      ? 'bg-card border-foreground/30 text-foreground font-medium hover:bg-muted/30 shadow-2xs'
                      : 'bg-muted/15 border-border/50 text-muted-foreground hover:bg-muted/30 hover:text-foreground opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={`size-4 rounded-sm flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-foreground text-background'
                          : 'border border-border bg-background'
                      }`}
                    >
                      {isSelected && <Check className="size-2.5 stroke-[3]" />}
                    </div>
                    <span className="truncate" title={cat.name}>
                      {cat.name}
                    </span>
                  </div>
                  <span
                    className={`font-mono tabular-nums text-3xs ml-1.5 px-1.5 py-0.5 rounded-sm shrink-0 ${
                      isSelected
                        ? 'bg-muted/70 text-foreground font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {cat.productCount} SKU
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <WizardSampleProductsTable sampleProducts={analysis.sampleProducts} />
    </div>
  );
}
