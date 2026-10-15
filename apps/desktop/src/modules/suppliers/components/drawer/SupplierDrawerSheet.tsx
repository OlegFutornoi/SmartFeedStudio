import React, { useState, useEffect } from 'react';
import { Home, Rss, FolderTree, TrendingUp, DollarSign, Package } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';
import type { SupplierDto } from '@smartfeed/shared';
import { SupplierDrawerHeader } from '@/modules/suppliers/components/drawer/SupplierDrawerHeader';
import { SupplierDrawerFooter } from '@/modules/suppliers/components/drawer/SupplierDrawerFooter';
import { SupplierDrawerOverviewTab } from '@/modules/suppliers/components/drawer/tabs/SupplierDrawerOverviewTab';
import { SupplierFeedsTab } from '@/modules/suppliers/components/details/tabs/SupplierFeedsTab';
import { SupplierCategoriesTab } from '@/modules/suppliers/components/details/tabs/SupplierCategoriesTab';
import { SupplierPricingTab } from '@/modules/suppliers/components/details/tabs/SupplierPricingTab';
import { SupplierCurrenciesTab } from '@/modules/suppliers/components/details/tabs/SupplierCurrenciesTab';
import { SupplierProductsTab } from '@/modules/suppliers/components/details/tabs/SupplierProductsTab';

interface SupplierDrawerSheetProps {
  isOpen: boolean;
  supplier: SupplierDto | null;
  initialTab?: string;
  onClose: () => void;
  onToggleStatus: () => void;
  onEdit: (supplier: SupplierDto) => void;
  onDelete: (id: string) => void;
  onRefreshSupplier: () => void;
  onConnectFeed?: () => void;
}

export const SupplierDrawerSheet: React.FC<SupplierDrawerSheetProps> = ({
  isOpen,
  supplier,
  initialTab = 'overview',
  onClose,
  onToggleStatus,
  onEdit,
  onDelete,
  onRefreshSupplier,
  onConnectFeed,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    if (!isOpen) {
      setIsExpanded(false);
    }
  }, [isOpen, initialTab]);

  if (!supplier) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
      <SheetContent
        side="right"
        hideOverlay={true}
        onPointerDownOutside={onClose}
        className={cn(
          'p-0 flex flex-col h-full bg-background border-l border-border/80 shadow-2xl z-50 overflow-hidden outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 transition-all duration-300 ease-in-out',
          isExpanded
            ? 'w-full max-w-none'
            : 'w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl',
        )}
        data-testid="supplier-drawer-sheet"
      >
        {/* Header */}
        <SupplierDrawerHeader supplier={supplier} onToggleStatus={onToggleStatus} />

        {/* Tabs and Tab Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          {/* Horizontal Tabs Header Bar (Menu pill style, zero borders) */}
          <div className="px-5 py-2 border-b border-border/60 bg-muted/20 shrink-0">
            <TabsList className="h-9 bg-muted/40 p-1 rounded-xl gap-1 overflow-x-auto justify-start w-full border-0">
              <TabsTrigger
                value="overview"
                className="h-7 px-3 text-xs gap-1.5 rounded-lg border-0 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/60 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium"
                data-testid="supplier-drawer-tab-overview"
              >
                <Home className="size-3.5" />
                {t('suppliers:tabOverview', { defaultValue: 'Загальне' })}
              </TabsTrigger>

              <TabsTrigger
                value="feeds"
                className="h-7 px-3 text-xs gap-1.5 rounded-lg border-0 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/60 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium"
                data-testid="supplier-drawer-tab-feeds"
              >
                <Rss className="size-3.5" />
                {t('suppliers:tabFeeds', { defaultValue: 'Джерела фідів' })}
              </TabsTrigger>

              <TabsTrigger
                value="categories"
                className="h-7 px-3 text-xs gap-1.5 rounded-lg border-0 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/60 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium"
                data-testid="supplier-drawer-tab-categories"
              >
                <FolderTree className="size-3.5" />
                {t('suppliers:tabCategories', { defaultValue: 'Категорії' })}
              </TabsTrigger>

              <TabsTrigger
                value="pricing"
                className="h-7 px-3 text-xs gap-1.5 rounded-lg border-0 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/60 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium"
                data-testid="supplier-drawer-tab-pricing"
              >
                <TrendingUp className="size-3.5" />
                {t('suppliers:tabPricing', { defaultValue: 'Націнки' })}
              </TabsTrigger>

              <TabsTrigger
                value="currencies"
                className="h-7 px-3 text-xs gap-1.5 rounded-lg border-0 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/60 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium"
                data-testid="supplier-drawer-tab-currencies"
              >
                <DollarSign className="size-3.5" />
                {t('suppliers:tabCurrencies', { defaultValue: 'Багатовалютність' })}
              </TabsTrigger>

              <TabsTrigger
                value="products"
                className="h-7 px-3 text-xs gap-1.5 rounded-lg border-0 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/60 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium"
                data-testid="supplier-drawer-tab-products"
              >
                <Package className="size-3.5" />
                {t('suppliers:tabProducts', { defaultValue: 'Товари' })}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Scrollable Tab Body */}
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="overview" className="m-0 focus-visible:outline-none">
              <SupplierDrawerOverviewTab
                supplier={supplier}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            </TabsContent>

            <TabsContent value="feeds" className="m-0 p-5 focus-visible:outline-none">
              <SupplierFeedsTab
                supplier={supplier}
                onRefreshSupplier={onRefreshSupplier}
                onConnectFeed={onConnectFeed || (() => {})}
              />
            </TabsContent>

            <TabsContent value="categories" className="m-0 p-5 focus-visible:outline-none">
              <SupplierCategoriesTab supplier={supplier} onRefreshSupplier={onRefreshSupplier} />
            </TabsContent>

            <TabsContent value="pricing" className="m-0 p-5 focus-visible:outline-none">
              <SupplierPricingTab supplier={supplier} onRefreshSupplier={onRefreshSupplier} />
            </TabsContent>

            <TabsContent value="currencies" className="m-0 p-5 focus-visible:outline-none">
              <SupplierCurrenciesTab supplier={supplier} onRefreshSupplier={onRefreshSupplier} />
            </TabsContent>

            <TabsContent value="products" className="m-0 p-5 focus-visible:outline-none">
              <SupplierProductsTab supplier={supplier} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer Actions */}
        <SupplierDrawerFooter
          supplier={supplier}
          onEdit={onEdit}
          onDelete={onDelete}
          onClose={onClose}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded((prev) => !prev)}
        />
      </SheetContent>
    </Sheet>
  );
};
