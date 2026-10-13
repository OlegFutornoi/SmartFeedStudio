'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { NavigationItemList } from '@/components/navigation/NavigationItemList';
import { NavigationLivePreview } from '@/components/navigation/NavigationLivePreview';
import { NavigationFeedbackAlerts } from '@/components/navigation/NavigationFeedbackAlerts';
import { useNavigationPageState } from '@/hooks/useNavigationPageState';

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

export default function NavigationManagementPage() {
  const {
    items,
    filterApp,
    setFilterApp,
    isLoading,
    error,
    successMessage,
    isDialogOpen,
    editingItem,
    formData,
    setFormData,
    isSaving,
    deleteItem,
    setDeleteItem,
    isDeleting,
    locale,
    t,
    handleOpenCreate,
    handleOpenEdit,
    handleSave,
    handleToggleActive,
    handleDelete,
    handleConfirmDelete,
    handleMoveUp,
    handleMoveDown,
    handleCloseDialog,
  } = useNavigationPageState();

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <NavigationFeedbackAlerts successMessage={successMessage} error={error} />

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
              onAddItem={handleOpenCreate}
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
