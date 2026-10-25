import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Rss, FolderTree, SlidersHorizontal, Package } from 'lucide-react';
import { SupplierDto } from '@smartfeed/shared';
import { SupplierDetailHeader } from '@/modules/suppliers/components/details/SupplierDetailHeader';
import { SupplierFeedsTab } from '@/modules/suppliers/components/details/tabs/SupplierFeedsTab';
import { SupplierCategoriesTab } from '@/modules/suppliers/components/details/tabs/SupplierCategoriesTab';
import { SupplierPricingTab } from '@/modules/suppliers/components/details/tabs/SupplierPricingTab';
import { SupplierProductsTab } from '@/modules/suppliers/components/details/tabs/SupplierProductsTab';
import { useTranslation } from '@/i18n';
import type { SupplierTabType } from '@/modules/suppliers/types';

interface SupplierDetailWorkspaceProps {
  supplier: SupplierDto;
  onBack: () => void;
  onEdit: (supplier: SupplierDto) => void;
  onDelete: (supplierId: string) => void;
  onConnectFeed: (supplierId: string) => void;
  onRefreshSupplier: () => void;
  onToggleStatus: () => void;
}

export const SupplierDetailWorkspace: React.FC<SupplierDetailWorkspaceProps> = ({
  supplier,
  onBack,
  onEdit,
  onDelete,
  onConnectFeed,
  onRefreshSupplier,
  onToggleStatus,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const [activeTab, setActiveTab] = useState<SupplierTabType>('feeds');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncFeeds = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      onRefreshSupplier();
    }, 1200);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto" data-testid="supplier-detail-workspace">
      {/* 1. Header Profile & Meta */}
      <SupplierDetailHeader
        supplier={supplier}
        isSyncing={isSyncing}
        onBack={onBack}
        onEdit={() => onEdit(supplier)}
        onDelete={() => onDelete(supplier.id)}
        onSyncFeeds={handleSyncFeeds}
        onToggleStatus={onToggleStatus}
      />

      {/* 2. Workspace Navigation Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as SupplierTabType)}
        className="w-full space-y-4"
      >
        <div className="border-b border-border/80 pb-px">
          <TabsList className="h-9 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger
              value="feeds"
              className="text-xs gap-1.5 h-7 data-[state=active]:bg-card shadow-xs"
              data-testid="tab-feeds"
            >
              <Rss className="size-3.5" />
              {t('suppliers:tabFeeds', { defaultValue: 'Джерела фідів' })}
            </TabsTrigger>

            <TabsTrigger
              value="categories"
              className="text-xs gap-1.5 h-7 data-[state=active]:bg-card shadow-xs"
              data-testid="tab-categories"
            >
              <FolderTree className="size-3.5" />
              {t('suppliers:tabCategories', { defaultValue: 'Категорії' })}
            </TabsTrigger>

            <TabsTrigger
              value="pricing"
              className="text-xs gap-1.5 h-7 data-[state=active]:bg-card shadow-xs"
              data-testid="tab-pricing"
            >
              <SlidersHorizontal className="size-3.5" />
              {t('suppliers:tabPricing', { defaultValue: 'Націнки та правила' })}
            </TabsTrigger>

            <TabsTrigger
              value="products"
              className="text-xs gap-1.5 h-7 data-[state=active]:bg-card shadow-xs"
              data-testid="tab-products"
            >
              <Package className="size-3.5" />
              {t('suppliers:tabProducts', { defaultValue: 'Товари' })}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Feeds */}
        <TabsContent value="feeds" className="mt-0 focus-visible:outline-none">
          <SupplierFeedsTab
            supplier={supplier}
            onConnectFeed={() => onConnectFeed(supplier.id)}
            onRefreshSupplier={onRefreshSupplier}
          />
        </TabsContent>

        {/* Tab 2: Categories */}
        <TabsContent value="categories" className="mt-0 focus-visible:outline-none">
          <SupplierCategoriesTab supplier={supplier} onRefreshSupplier={onRefreshSupplier} />
        </TabsContent>

        {/* Tab 3: Pricing */}
        <TabsContent value="pricing" className="mt-0 focus-visible:outline-none">
          <SupplierPricingTab supplier={supplier} onRefreshSupplier={onRefreshSupplier} />
        </TabsContent>

        {/* Tab 4: Products */}
        <TabsContent value="products" className="mt-0 focus-visible:outline-none">
          <SupplierProductsTab supplier={supplier} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
