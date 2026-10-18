import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FolderTree } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead } from '@/components/ui/table';
import type { SupplierDto, SupplierCategoryRuleDto } from '@smartfeed/shared';
import {
  getSupplierCategories,
  toggleSupplierCategory,
  batchToggleSupplierCategories,
  updateSupplierCategoryRule,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { SupplierCategoryRow } from '@/modules/suppliers/components/details/tabs/SupplierCategoryRow';
import { SupplierCategoriesToolbar } from '@/modules/suppliers/components/details/tabs/SupplierCategoriesToolbar';

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
  const [selectedFeedId, setSelectedFeedId] = useState<string>('ALL');
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
      const ids = filtered.map((c) => c.id);
      await batchToggleSupplierCategories(supplier.id, ids, active, token || undefined);
      setCategories((prev) =>
        prev.map((c) => (ids.includes(c.id) ? { ...c, isActive: active } : c)),
      );
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

  // Derive unique feeds represented in categories
  const availableFeeds = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) {
      if (c.feedSourceId && c.feedName) {
        map.set(c.feedSourceId, c.feedName);
      } else if (c.feedName) {
        map.set(c.feedName, c.feedName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [categories]);

  const filtered = useMemo(() => {
    let list = categories;
    if (selectedFeedId && selectedFeedId !== 'ALL') {
      list = list.filter((c) => c.feedSourceId === selectedFeedId || c.feedName === selectedFeedId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [categories, selectedFeedId, search]);

  const activeCount = categories.filter((c) => c.isActive).length;

  return (
    <div className="space-y-4" data-testid="supplier-categories-tab">
      {/* Top toolbar & Filter Banner */}
      <SupplierCategoriesToolbar
        search={search}
        onSearchChange={setSearch}
        selectedFeedId={selectedFeedId}
        onSelectFeedId={setSelectedFeedId}
        availableFeeds={availableFeeds}
        activeCount={activeCount}
        totalCount={categories.length}
        onBatchToggle={handleBatchToggle}
      />

      {/* Table & Empty States */}
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
            {search || selectedFeedId !== 'ALL'
              ? t('suppliers:noCategoriesFound', {
                  defaultValue: 'Категорій за запитом не знайдено',
                })
              : t('suppliers:noCategoriesYet', {
                  defaultValue: 'У цього постачальника ще немає категорій',
                })}
          </p>
          {!search && selectedFeedId === 'ALL' && (
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
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
                <TableHead className="w-[70px] pl-3.5 font-semibold text-foreground text-center">
                  {t('suppliers:columnStatus', { defaultValue: 'Статус' })}
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  {t('suppliers:columnCategoryName', { defaultValue: 'Категорія товару' })}
                </TableHead>
                <TableHead className="w-[180px] font-semibold text-foreground">
                  {t('suppliers:columnFeedSource', { defaultValue: 'Джерело фіду' })}
                </TableHead>
                <TableHead className="w-[90px] font-semibold text-foreground text-center">
                  {t('suppliers:columnProducts', { defaultValue: 'Товари' })}
                </TableHead>
                <TableHead className="w-[160px] pr-3.5 text-right font-semibold text-foreground">
                  {t('suppliers:columnCategoryMarkup', { defaultValue: 'Націнка категорії (%)' })}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cat) => (
                <SupplierCategoryRow
                  key={cat.id}
                  category={cat}
                  defaultMarginPercent={supplier.defaultMarginPercent || 0}
                  onToggleStatus={handleToggleStatus}
                  onUpdateMarkup={handleUpdateMarkup}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
