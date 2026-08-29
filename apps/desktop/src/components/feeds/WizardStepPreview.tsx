import { useState, useMemo } from 'react';
import { FeedAnalysisResult } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Layers,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Image as ImageIcon,
  Search,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from '@/i18n';

interface WizardStepPreviewProps {
  analysis: FeedAnalysisResult;
  selectedCategoryIds: string[];
  setSelectedCategoryIds: (ids: string[]) => void;
  remainingQuota: number;
}

export function WizardStepPreview({
  analysis,
  selectedCategoryIds,
  setSelectedCategoryIds,
  remainingQuota,
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

  const isQuotaExceeded = totalSelectedSkus > remainingQuota;

  const handleSelectAll = () => {
    setSelectedCategoryIds(categories.map((c) => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedCategoryIds([]);
  };

  const toggleCategory = (id: string) => {
    if (selectedCategoryIds.includes(id)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((catId) => catId !== id));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, id]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Summary Header */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-secondary/60 border border-border/80 shadow-xs">
          <div className="text-xs text-muted-foreground font-medium">
            {t('suppliers:detectedFormat', { defaultValue: 'Формат фіду' })}
          </div>
          <Badge variant="outline" className="mt-1 text-xs font-mono bg-background border-border">
            {analysis.format}
          </Badge>
        </div>

        <div className="p-3 rounded-xl bg-secondary/60 border border-border/80 shadow-xs">
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <ShoppingBag className="size-3.5 text-primary" />
            {t('suppliers:totalProductsFound', { defaultValue: 'Знайдено товарів' })}
          </div>
          <div className="text-base font-bold text-foreground mt-0.5 font-mono">
            {analysis.totalDetected.toLocaleString('uk-UA')} SKU
          </div>
        </div>

        <div className="p-3 rounded-xl bg-secondary/60 border border-border/80 shadow-xs">
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Layers className="size-3.5 text-primary" />
            {t('suppliers:categoriesFound', { defaultValue: 'Категорій' })}
          </div>
          <div className="text-base font-bold text-foreground mt-0.5 font-mono">
            {analysis.categoriesCount}
          </div>
        </div>
      </div>

      {/* Category Selection Checklist with Quota Control */}
      {categories.length > 0 && (
        <div className="p-3.5 rounded-xl border border-border bg-card space-y-3 shadow-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                {t('suppliers:selectCategoriesToImport', {
                  defaultValue: 'Оберіть категорії для імпорту:',
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t('suppliers:selectCategoriesHint', {
                  defaultValue:
                    'Імпортуйте лише потрібні категорії, щоб заощаджувати ліміти вашого тарифу.',
                })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2 flex items-center gap-1"
                onClick={handleSelectAll}
              >
                <CheckSquare className="size-3" />
                {t('suppliers:selectAll', { defaultValue: 'Обрати всі' })}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 flex items-center gap-1 text-muted-foreground hover:text-foreground"
                onClick={handleDeselectAll}
              >
                <Square className="size-3" />
                {t('suppliers:deselectAll', { defaultValue: 'Зняти всі' })}
              </Button>
            </div>
          </div>

          {/* Category Search filter */}
          {categories.length > 6 && (
            <div className="relative">
              <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder={t('suppliers:searchCategoryPlaceholder', {
                  defaultValue: 'Пошук серед категорій фіду...',
                })}
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>
          )}

          {/* Categories Grid */}
          <div className="max-h-36 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 p-1 bg-secondary/20 rounded-lg border border-border/50">
            {filteredCategories.map((cat) => {
              const isSelected = selectedCategoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center justify-between p-2 rounded-lg text-left text-xs transition-all border ${
                    isSelected
                      ? 'bg-primary/10 border-primary/40 text-foreground font-medium'
                      : 'bg-card/70 border-border/60 text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={`size-4 rounded flex items-center justify-center shrink-0 text-[10px] ${
                        isSelected
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'border border-border bg-background'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </div>
                    <span className="truncate" title={cat.name}>
                      {cat.name}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] text-muted-foreground ml-1.5 shrink-0">
                    {cat.productCount} SKU
                  </span>
                </button>
              );
            })}
          </div>

          {/* Live Quota Bar */}
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 flex-wrap ${
              isQuotaExceeded
                ? 'bg-destructive/10 border-destructive/30 text-destructive'
                : 'bg-secondary/40 border-border/60 text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              {isQuotaExceeded ? (
                <AlertTriangle className="size-4 text-destructive shrink-0" />
              ) : (
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
              )}
              <span>
                {t('suppliers:selectedToImport', { defaultValue: 'Обрано до імпорту:' })}{' '}
                <strong className="font-mono">
                  {totalSelectedSkus.toLocaleString('uk-UA')} SKU
                </strong>{' '}
                ({selectedCategoryIds.length} з {categories.length} категорій)
              </span>
            </div>

            <div className="text-[11px] font-mono text-muted-foreground">
              {t('suppliers:quotaLimitAvailable', { defaultValue: 'Доступно за лімітом:' })}{' '}
              <strong className={isQuotaExceeded ? 'text-destructive' : 'text-foreground'}>
                {remainingQuota.toLocaleString('uk-UA')} SKU
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Sample Products Table (100% Solid sticky thead) */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
          <span>
            {t('suppliers:sampleProductsTitle', {
              defaultValue: 'Попередній перегляд товарів (перші 5):',
            })}
          </span>
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="size-3.5" />
            {t('suppliers:markupCalculatedLive', { defaultValue: 'Націнка врахована' })}
          </span>
        </div>

        <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-muted sticky top-0 z-10 border-b border-border shadow-xs">
                <tr className="text-foreground text-[11px] font-semibold uppercase tracking-wider">
                  <th className="p-2.5 w-12 bg-muted">Фото</th>
                  <th className="p-2.5 w-28 bg-muted">Артикул / SKU</th>
                  <th className="p-2.5 bg-muted">Назва товару</th>
                  <th className="p-2.5 text-right w-44 bg-muted">Закупка → Продаж</th>
                  <th className="p-2.5 text-center w-28 bg-muted">Наявність</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 bg-card">
                {analysis.sampleProducts.map((prod, idx) => (
                  <tr key={idx} className="hover:bg-secondary/40 transition-colors">
                    <td className="p-2.5">
                      {prod.images && prod.images.length > 0 ? (
                        <img
                          src={prod.images[0].originalUrl}
                          alt=""
                          className="size-8 rounded-md object-cover border border-border bg-background"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="size-8 rounded-md bg-secondary flex items-center justify-center text-muted-foreground border border-border/50">
                          <ImageIcon className="size-4" />
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-xs font-semibold text-foreground truncate">
                      {prod.sku}
                    </td>
                    <td className="p-2.5 text-foreground font-medium">
                      <div className="truncate max-w-sm" title={prod.titleUk}>
                        {prod.titleUk}
                      </div>
                    </td>
                    <td className="p-2.5 text-right whitespace-nowrap font-mono text-xs">
                      <span className="text-muted-foreground line-through text-[11px] mr-1">
                        {prod.costPrice.toLocaleString('uk-UA')} ₴
                      </span>
                      <ArrowRight className="size-3 inline text-primary mx-1" />
                      <span className="font-bold text-emerald-400">
                        {prod.price.toLocaleString('uk-UA')} ₴
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <Badge
                        variant={prod.inStock ? 'secondary' : 'outline'}
                        className={`text-[10px] px-2 py-0.5 font-medium ${
                          prod.inStock
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-muted-foreground bg-secondary/50'
                        }`}
                      >
                        {prod.inStock ? 'В наявності' : 'Немає'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
