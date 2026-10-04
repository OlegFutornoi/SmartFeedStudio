'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  NavigationItemDto,
  CreateNavigationItemDto,
  UpdateNavigationItemDto,
  Role,
  TargetApp,
} from '@smartfeed/shared';
import { api } from '@/lib/api';
import { translateError } from '@/lib/errors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { NavigationHeader } from '@/components/navigation/NavigationHeader';
import { NavigationItemList } from '@/components/navigation/NavigationItemList';
import { NavigationLivePreview } from '@/components/navigation/NavigationLivePreview';
import type { NavigationFormData } from '@/components/navigation/NavigationItemDialog';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

const NavigationItemDialog = dynamic(
  () =>
    import('@/components/navigation/NavigationItemDialog').then((m) => ({
      default: m.NavigationItemDialog,
    })),
  { ssr: false },
);

const NavigationDeleteDialog = dynamic(
  () =>
    import('@/components/navigation/NavigationDeleteDialog').then((m) => ({
      default: m.NavigationDeleteDialog,
    })),
  { ssr: false },
);

const INITIAL_FORM_DATA: NavigationFormData = {
  key: '',
  targetApp: TargetApp.DESKTOP,
  labelUk: '',
  labelEn: '',
  path: '',
  icon: 'LayoutDashboard',
  requiredRoles: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
  requiredPlan: null,
  isVisible: true,
};

export default function NavigationManagementPage() {
  const { refreshNavigation } = useNavigation();
  const [items, setItems] = useState<NavigationItemDto[]>([]);
  const [filterApp, setFilterApp] = useState<TargetApp>(TargetApp.DESKTOP);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationItemDto | null>(null);
  const [formData, setFormData] = useState<NavigationFormData>(INITIAL_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteItem, setDeleteItem] = useState<NavigationItemDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { t, locale } = useLanguage();
  const localeRef = useRef(locale);
  localeRef.current = locale;

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getAdminNavigationItems();
      setItems(data);
    } catch (err: unknown) {
      setError(translateError(err, localeRef.current));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const showSuccess = useCallback((msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingItem(null);
    setFormData(INITIAL_FORM_DATA);
    setIsDialogOpen(true);
  }, []);

  const handleOpenEdit = useCallback((item: NavigationItemDto) => {
    setEditingItem(item);
    setFormData({
      key: item.key,
      targetApp: item.targetApp,
      labelUk: item.labelUk,
      labelEn: item.labelEn,
      path: item.path,
      icon: item.icon,
      requiredRoles: item.requiredRoles,
      requiredPlan: item.requiredPlan ?? null,
      isVisible: item.isVisible,
    });
    setIsDialogOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      setError(null);

      if (editingItem) {
        const updateDto: UpdateNavigationItemDto = {
          labelUk: formData.labelUk,
          labelEn: formData.labelEn,
          path: formData.path,
          icon: formData.icon,
          requiredRoles: formData.requiredRoles,
          requiredPlan: formData.requiredPlan,
          isVisible: formData.isVisible,
        };
        await api.updateNavigationItem(editingItem.id, updateDto);
        showSuccess(t('navigation', 'success_updated'));
      } else {
        const createDto: CreateNavigationItemDto = {
          key: formData.key.trim().toLowerCase(),
          targetApp: formData.targetApp,
          labelUk: formData.labelUk,
          labelEn: formData.labelEn,
          path: formData.path,
          icon: formData.icon,
          requiredRoles: formData.requiredRoles,
          requiredPlan: formData.requiredPlan,
          isVisible: formData.isVisible,
          order: items.length + 1,
        };
        await api.createNavigationItem(createDto);
        showSuccess(t('navigation', 'success_created'));
      }

      setIsDialogOpen(false);
      await loadItems();
      await refreshNavigation();
    } catch (err: unknown) {
      setError(translateError(err, locale));
    } finally {
      setIsSaving(false);
    }
  }, [editingItem, formData, items.length, locale, loadItems, refreshNavigation, showSuccess, t]);

  const handleToggleActive = useCallback(
    async (item: NavigationItemDto) => {
      try {
        await api.updateNavigationItem(item.id, { isVisible: !item.isVisible });
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isVisible: !i.isVisible } : i)),
        );
        await refreshNavigation();
      } catch (err: unknown) {
        setError(translateError(err, locale));
      }
    },
    [locale, refreshNavigation],
  );

  const handleDelete = useCallback((item: NavigationItemDto) => {
    setDeleteItem(item);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteItem) return;
    try {
      setIsDeleting(true);
      await api.deleteNavigationItem(deleteItem.id);
      showSuccess(t('navigation', 'success_deleted'));
      setDeleteItem(null);
      await loadItems();
      await refreshNavigation();
    } catch (err: unknown) {
      setError(translateError(err, locale));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteItem, locale, loadItems, refreshNavigation, showSuccess, t]);

  const handleMove = useCallback(
    async (index: number, direction: 'UP' | 'DOWN', currentFilteredList: NavigationItemDto[]) => {
      const targetIndex = direction === 'UP' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentFilteredList.length) return;

      const reorderedFiltered = [...currentFilteredList];
      const [moved] = reorderedFiltered.splice(index, 1);
      reorderedFiltered.splice(targetIndex, 0, moved);

      const itemOrders = reorderedFiltered.map((item, idx) => ({ id: item.id, order: idx + 1 }));

      setItems((prevItems) => {
        const orderMap = new Map(itemOrders.map((o) => [o.id, o.order]));
        return prevItems
          .map((prev) => {
            const newOrder = orderMap.get(prev.id);
            return newOrder !== undefined ? { ...prev, order: newOrder } : prev;
          })
          .sort((a, b) => a.order - b.order);
      });

      try {
        await api.reorderNavigationItems({ items: itemOrders });
        await refreshNavigation();
      } catch (err: unknown) {
        setError(translateError(err, locale));
        await loadItems();
      }
    },
    [locale, loadItems, refreshNavigation],
  );

  const handleMoveUp = useCallback(
    (idx: number, filteredList: NavigationItemDto[]) => handleMove(idx, 'UP', filteredList),
    [handleMove],
  );
  const handleMoveDown = useCallback(
    (idx: number, filteredList: NavigationItemDto[]) => handleMove(idx, 'DOWN', filteredList),
    [handleMove],
  );
  const handleCloseDialog = useCallback(() => setIsDialogOpen(false), []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <NavigationHeader onAddItem={handleOpenCreate} />

      {/* Success Alert */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary text-xs font-medium animate-in fade-in">
          <Check className="h-4 w-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Localized Error Alert */}
      {error && (
        <div
          data-testid="error-alert"
          className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-xs font-medium animate-in fade-in"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm">{t('common', 'loading')}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <NavigationItemList
              items={items}
              filterApp={filterApp}
              onFilterChange={setFilterApp}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onToggleActive={handleToggleActive}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          </div>

          <div className="lg:col-span-1">
            <NavigationLivePreview items={items} />
          </div>
        </div>
      )}

      <NavigationItemDialog
        isOpen={isDialogOpen}
        editingItem={editingItem}
        formData={formData}
        setFormData={setFormData}
        isSaving={isSaving}
        onClose={handleCloseDialog}
        onSave={handleSave}
      />

      <NavigationDeleteDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        item={deleteItem}
        isUk={locale === 'uk'}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
