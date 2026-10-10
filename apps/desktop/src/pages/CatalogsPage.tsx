import { useState, useEffect, useCallback, useRef } from 'react';
import { Layers, Store, Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import { useLicense } from '@/hooks/useLicense';
import { useAuth } from '@/contexts/AuthContext';
import { useBackgroundJobs } from '@/contexts/BackgroundJobsContext';
import { useQuotas } from '@/hooks/useQuotas';
import { ExpiredPlanBlocker } from '@/components/layout/ExpiredPlanBlocker';
import { ExportChannelsList } from '@/components/export/ExportChannelsList';
import { ProductsView } from '@/components/products/ProductsView';
import { ConnectedFeedsList } from '@/components/catalogs/ConnectedFeedsList';
import { ImportFeedWizardDialog } from '@/components/feeds/ImportFeedWizardDialog';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import {
  getSuppliers,
  getAllFeedSources,
  syncSupplierFeedSource,
  deleteSupplierFeedSource,
  FeedSourceItemDto,
} from '@/lib/api';
import { SupplierDto } from '@smartfeed/shared';
import { useDataSync, emitDataSync } from '@/lib/syncEvents';
import { localDb } from '@/services/local-db';

export function CatalogsPage() {
  const { t, language } = useTranslation(['catalogs', 'suppliers', 'common']);
  const isUk = language === 'uk';
  const { isExpired } = useLicense();
  const { token } = useAuth();
  const { refreshQuotas, isFeedLimitReached, updateLocalQuota } = useQuotas();
  const { addTrackedJob, runBackgroundTask } = useBackgroundJobs();

  const [activeTab, setActiveTab] = useState<'products' | 'catalogs' | 'channels'>('products');
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [feeds, setFeeds] = useState<FeedSourceItemDto[]>([]);
  const [totalProductsCount, setTotalProductsCount] = useState<number>(0);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [feedToDelete, setFeedToDelete] = useState<FeedSourceItemDto | null>(null);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const isFetchingRef = useRef<boolean>(false);

  const loadData = useCallback(async () => {
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      const [suppliersData, feedsData, productsRes] = await Promise.all([
        getSuppliers(token || undefined),
        getAllFeedSources(token || undefined),
        localDb.products.getProducts({ limit: 1 }),
      ]);
      setSuppliers(suppliersData || []);
      setFeeds(feedsData || []);
      setTotalProductsCount(
        productsRes?.total ?? (Array.isArray(productsRes) ? productsRes.length : 0),
      );
    } catch (e) {
      console.warn('[CatalogsPage:loadData] Failed to load catalogs data:', e);
    } finally {
      isFetchingRef.current = false;
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useDataSync(['suppliers', 'feeds', 'products', 'quotas', 'all'], () => {
    loadData();
  });

  const handleSyncFeed = async (feed: FeedSourceItemDto) => {
    setSyncingId(feed.id);
    try {
      const res = await syncSupplierFeedSource(feed.supplierId, feed.id, token || undefined);
      addTrackedJob(res.jobId);
      emitDataSync(['suppliers', 'feeds', 'products', 'quotas']);
    } catch (e) {
      console.warn('[CatalogsPage:handleSyncFeed] Failed to sync feed:', e);
    } finally {
      setSyncingId(null);
    }
  };

  const handleConfirmDeleteFeed = async () => {
    if (!feedToDelete) return;
    const target = feedToDelete;
    setFeedToDelete(null);

    try {
      await runBackgroundTask({
        kind: 'DELETE_FEED',
        title: isUk ? `Видалення фіду «${target.name}»` : `Deleting feed «${target.name}»`,
        subtitle: isUk
          ? 'Видалення джерела та товарів у фоні'
          : 'Deleting feed and products in background',
        action: async () => {
          const res = await deleteSupplierFeedSource(
            target.supplierId,
            target.id,
            token || undefined,
            true,
          );
          if (res?.deletedProductsCount && res.deletedProductsCount > 0) {
            updateLocalQuota('products', -res.deletedProductsCount);
          }
          updateLocalQuota('feeds', -1);
          refreshQuotas();
          emitDataSync(['suppliers', 'feeds', 'products', 'quotas', 'all']);
        },
      });
    } catch (e) {
      console.warn('[CatalogsPage:handleConfirmDeleteFeed] Failed to delete feed:', e);
    }
  };

  if (isExpired) {
    return <ExpiredPlanBlocker featureName={t('catalogs:title')} />;
  }

  return (
    <div
      data-testid="catalogs-page"
      className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300"
    >
      {/* Top Toolbar: Tabs Navigation Bar + Import Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs Navigation Bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-secondary/30 border border-border/80 rounded-xl w-fit">
          {/* Products Grid Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'products'
                ? 'bg-card text-foreground shadow-sm border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-products"
          >
            <Package className="size-4 text-primary" />
            <span>{t('catalogs:tabProducts')}</span>
          </button>

          {/* Feed Sources Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('catalogs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'catalogs'
                ? 'bg-card text-foreground shadow-sm border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-catalogs"
          >
            <Layers className="size-4 text-primary" />
            <span>{t('catalogs:tabCatalogs')}</span>
            <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5 font-semibold">
              {feeds.length}
            </Badge>
          </button>

          {/* Export Channels Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('channels')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'channels'
                ? 'bg-card text-foreground shadow-sm border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-export-channels"
          >
            <Store className="size-4 text-primary" />
            <span>{t('catalogs:tabChannels')}</span>
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 h-5 font-medium bg-primary/10 text-primary border-primary/20"
            >
              {t('catalogs:reverseMargin')}
            </Badge>
          </button>
        </div>

        {/* Import Action Button */}
        {!(activeTab === 'products' && totalProductsCount === 0 && feeds.length === 0) && (
          <Button
            size="sm"
            onClick={() => setIsImportWizardOpen(true)}
            disabled={isFeedLimitReached}
            title={isFeedLimitReached ? t('catalogs:feedLimitReachedTooltip') : undefined}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs px-3.5 h-9 rounded-lg shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
            data-testid="catalogs-import-feed-btn"
          >
            <Plus className="size-3.5" />
            <span>{t('catalogs:importButton')}</span>
          </Button>
        )}
      </div>

      {/* Tab 1: Products Grid */}
      {activeTab === 'products' && (
        <ProductsView
          onOpenImportWizard={() => setIsImportWizardOpen(true)}
          isFeedLimitReached={isFeedLimitReached}
        />
      )}

      {/* Tab 2: Export Channels */}
      {activeTab === 'channels' && (
        <ExportChannelsList catalogs={suppliers.map((s) => ({ id: s.id, name: s.name }))} />
      )}

      {/* Tab 3: Connected Feed Sources */}
      {activeTab === 'catalogs' && (
        <ConnectedFeedsList
          feeds={feeds}
          totalProductsCount={totalProductsCount}
          syncingId={syncingId}
          isFeedLimitReached={isFeedLimitReached}
          isUk={isUk}
          onSyncFeed={handleSyncFeed}
          onDeleteFeed={setFeedToDelete}
          onOpenImportWizard={() => setIsImportWizardOpen(true)}
        />
      )}

      {/* Import Feed Wizard Modal */}
      <ImportFeedWizardDialog
        isOpen={isImportWizardOpen}
        onClose={() => setIsImportWizardOpen(false)}
        suppliers={suppliers}
        onSuccess={() => {
          loadData();
          setIsImportWizardOpen(false);
        }}
      />

      {/* Confirm Delete Feed Dialog */}
      <ConfirmDeleteDialog
        isOpen={!!feedToDelete}
        title={t('catalogs:deleteFeedTitle')}
        description={t('catalogs:deleteFeedDesc', { name: feedToDelete?.name || '' })}
        confirmLabel={t('catalogs:deleteFeedConfirm')}
        cancelLabel={t('common:cancel')}
        onConfirm={handleConfirmDeleteFeed}
        onClose={() => setFeedToDelete(null)}
      />
    </div>
  );
}
