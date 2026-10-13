import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FolderTree, Search, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { SupplierDto, SupplierCategoryRuleDto } from '@smartfeed/shared';
import {
  getSupplierCategories,
  toggleSupplierCategory,
  batchToggleSupplierCategories,
  updateSupplierCategoryRule,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';

interface SupplierCategoriesTabProps {
  supplier: SupplierDto;
  onRefreshSupplier: () => void;
}

export const SupplierCategoriesTab: React.FC<SupplierCategoriesTabProps> = ({
  supplier,
  onRefreshSupplier,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const { token } = useAuth();

  const [categories, setCategories] = useState<SupplierCategoryRuleDto[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSupplierCategories(supplier.id, token || undefined);
      setCategories(data || []);
    } catch (err) {
      console.warn('[SupplierCategoriesTab:loadCategories] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supplier.id, token]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleToggleStatus = async (catId: string, currentActive: boolean) => {
    try {
      const nextActive = !currentActive;
      await toggleSupplierCategory(supplier.id, catId, nextActive, token || undefined);
      setCategories((prev) =>
        prev.map((c) => (c.id === catId ? { ...c, isActive: nextActive } : c)),
      );
      onRefreshSupplier();
    } catch (err) {
      console.warn('[SupplierCategoriesTab:handleToggleStatus] Error:', err);
    }
  };

  const handleBatchToggle = async (active: boolean) => {
    try {
      const ids = categories.map((c) => c.id);
      await batchToggleSupplierCategories(supplier.id, ids, active, token || undefined);
      setCategories((prev) => prev.map((c) => ({ ...c, isActive: active })));
      onRefreshSupplier();
    } catch (err) {
      console.warn('[SupplierCategoriesTab:handleBatchToggle] Error:', err);
    }
  };

  const handleUpdateMarkup = async (
    catId: string,
    marginPercent: number | null,
    fixedMarkup: number | null,
  ) => {
    try {
      await updateSupplierCategoryRule(
        supplier.id,
        catId,
        { marginPercent, fixedMarkup },
        token || undefined,
      );
      setCategories((prev) =>
        prev.map((c) => (c.id === catId ? { ...c, marginPercent, fixedMarkup } : c)),
      );
    } catch (err) {
      console.warn('[SupplierCategoriesTab:handleUpdateMarkup] Error:', err);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const activeCount = categories.filter((c) => c.isActive).length;

  return (
    <div className="space-y-4" data-testid="supplier-categories-tab">
      {/* Top toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t('suppliers:tabCategoriesTitle', { defaultValue: 'Категорійний аналіз та статуси' })}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('suppliers:tabCategoriesDesc', {
              defaultValue:
                'Керуйте активністю категорій постачальника (активні додаються в каталог, неактивні виключаються)',
            })}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBatchToggle(true)}
            className="h-8 text-xs gap-1"
            data-testid="activate-all-categories-btn"
          >
            <CheckCircle2 className="size-3 text-emerald-500" />
            {t('suppliers:activateAll', { defaultValue: 'Увімкнути всі' })}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBatchToggle(false)}
            className="h-8 text-xs gap-1"
            data-testid="deactivate-all-categories-btn"
          >
            <XCircle className="size-3 text-muted-foreground" />
            {t('suppliers:deactivateAll', { defaultValue: 'Вимкнути всі' })}
          </Button>
        </div>
      </div>

      {/* Search & Counter Banner */}
      <div className="flex items-center justify-between gap-3 bg-muted/40 p-2.5 rounded-xl border border-border/70">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('suppliers:searchCategory', {
              defaultValue: 'Пошук за назвою категорії...',
            })}
            className="pl-8 h-8 text-xs bg-background/80"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {t('suppliers:activeCategoriesStat', { defaultValue: 'Активно' })}:{' '}
          <span className="font-semibold text-foreground">
            {activeCount} / {categories.length}
          </span>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Card className="border border-border/80 bg-card/40 p-8 text-center">
          <p className="text-xs text-muted-foreground animate-pulse">
            {t('common:loading', { defaultValue: 'Завантаження...' })}
          </p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-card/40 p-8 text-center flex flex-col items-center justify-center">
          <FolderTree className="size-8 text-muted-foreground/50 mb-2" />
          <p className="text-xs font-semibold text-foreground">
            {search
              ? t('suppliers:noCategoriesFound', {
                  defaultValue: 'Категорій за запитом не знайдено',
                })
              : t('suppliers:noCategoriesYet', {
                  defaultValue: 'У цього постачальника ще немає категорій',
                })}
          </p>
          {!search && (
            <p className="text-[11px] text-muted-foreground mt-1 max-w-sm">
              {t('suppliers:noCategoriesYetHint', {
                defaultValue:
                  'Категорії будуть автоматично імпортовані після підключення та обробки XML/CSV фіду.',
              })}
            </p>
          )}
        </Card>
      ) : (
        <div className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-xs">
          <Table className="text-xs">
            {/* 100% Solid Sticky Header */}
            <TableHeader className="sticky top-0 bg-card z-10 border-b border-border/80">
              <TableRow className="h-9 hover:bg-transparent">
                <TableHead className="w-[80px] pl-3.5 font-semibold text-foreground text-center">
                  {t('suppliers:columnStatus', { defaultValue: 'Статус' })}
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  {t('suppliers:columnCategoryName', { defaultValue: 'Категорія товару' })}
                </TableHead>
                <TableHead className="w-[120px] font-semibold text-foreground text-center">
                  {t('suppliers:columnProducts', { defaultValue: 'Товари' })}
                </TableHead>
                <TableHead className="w-[200px] pr-3.5 text-right font-semibold text-foreground">
                  {t('suppliers:columnCategoryMarkup', { defaultValue: 'Націнка категорії (%)' })}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cat) => (
                <TableRow
                  key={cat.id}
                  className={`h-11 border-b border-border/60 transition-colors ${
                    !cat.isActive ? 'opacity-60 bg-muted/20' : 'hover:bg-muted/40'
                  }`}
                  data-testid={`category-row-${cat.id}`}
                >
                  {/* Switch Active / Inactive */}
                  <TableCell className="pl-3.5 py-2 text-center">
                    <Switch
                      checked={cat.isActive}
                      onCheckedChange={() => handleToggleStatus(cat.id, cat.isActive)}
                      className="data-[state=checked]:bg-emerald-500 scale-90"
                      data-testid={`toggle-category-${cat.id}`}
                    />
                  </TableCell>

                  {/* Category Name */}
                  <TableCell className="py-2 font-medium">
                    <div className="flex items-center gap-2">
                      <FolderTree className="size-3.5 text-muted-foreground shrink-0" />
                      <span
                        className={
                          cat.isActive ? 'text-foreground' : 'text-muted-foreground line-through'
                        }
                      >
                        {cat.name || (cat as unknown as { categoryName?: string }).categoryName}
                      </span>
                      {!cat.isActive && (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4.5 px-1.5 text-muted-foreground border-border"
                        >
                          {t('suppliers:categoryExcluded', {
                            defaultValue: 'Виключено з каталогу',
                          })}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Product Count */}
                  <TableCell className="py-2 text-center font-mono font-medium">
                    {cat.productCount.toLocaleString()}
                  </TableCell>

                  {/* Custom Category Markup Input */}
                  <TableCell className="pr-3.5 py-2 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <Input
                        type="number"
                        min="0"
                        max="200"
                        placeholder={String(supplier.defaultMarginPercent || 0)}
                        value={
                          cat.marginPercent !== null && cat.marginPercent !== undefined
                            ? cat.marginPercent
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          handleUpdateMarkup(cat.id, val, cat.fixedMarkup ?? null);
                        }}
                        className="w-20 h-7 text-xs text-right pr-2 font-mono bg-background/80"
                        data-testid={`category-margin-input-${cat.id}`}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
