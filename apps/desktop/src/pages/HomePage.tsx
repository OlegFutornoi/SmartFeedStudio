import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuotas } from '@/contexts/QuotasContext';
import { useLicense } from '@/hooks/useLicense';
import { useDataSync } from '@/lib/syncEvents';
import type { SupplierDto, FeedSourceDto } from '@smartfeed/shared';
import { getSuppliers } from '@/lib/api';
import { localDb } from '@/services/local-db';
import { useAppCounters } from '@/services/counters';
import { DashboardHeroBar } from '@/components/dashboard/DashboardHeroBar';
import { DashboardKpiGrid } from '@/components/dashboard/DashboardKpiGrid';
import { FeedSyncActivityChart } from '@/components/dashboard/FeedSyncActivityChart';
import { DashboardReadinessCard } from '@/components/dashboard/DashboardReadinessCard';
import { DashboardSuppliersCard } from '@/components/dashboard/DashboardSuppliersCard';
import { DashboardFeedsAndQuotasCard } from '@/components/dashboard/DashboardFeedsAndQuotasCard';

export function HomePage() {
  const { token, user } = useAuth();
  const { quotas } = useQuotas();
  const { license } = useLicense();
  const { counters } = useAppCounters();

  const [suppliersList, setSuppliersList] = useState<SupplierDto[]>([]);
  const [feedSources, setFeedSources] = useState<FeedSourceDto[]>([]);

  const isFetchingRef = useRef<boolean>(false);
  const lastFetchedTokenRef = useRef<string | null>(null);

  const loadDashboardData = useCallback(
    async (force = false) => {
      if (!token) return;
      if (!force && lastFetchedTokenRef.current === token) return;
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      lastFetchedTokenRef.current = token;

      try {
        const [suppliers, localFeeds] = await Promise.all([
          getSuppliers(token || undefined, undefined, force),
          localDb.feeds.getAllFeedSources().catch((err) => {
            console.warn('[HomePage] Failed to load local feed sources:', err);
            return [] as FeedSourceDto[];
          }),
        ]);
        setSuppliersList(suppliers);
        setFeedSources(localFeeds);
      } catch (err) {
        lastFetchedTokenRef.current = null;
        console.warn('[HomePage] Failed to load dashboard data:', err);
      } finally {
        isFetchingRef.current = false;
      }
    },
    [token],
  );

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useDataSync(['suppliers', 'feeds', 'products'], () => loadDashboardData(true));

  const suppliersCount = Math.max(
    quotas?.suppliers?.used ?? 0,
    suppliersList.length,
    counters.totalSuppliers,
  );
  const productsCount = Math.max(quotas?.products?.used ?? 0, counters.totalProducts);
  const feedsCount = Math.max(quotas?.feeds?.used ?? 0, feedSources.length, counters.totalFeeds);
  const totalRulesCount = counters.totalRules ?? 0;

  const activeSuppliersCount = suppliersList.filter((s) => s.isActive).length;
  const suppliersWithFeedsCount = suppliersList.filter((s) => (s.activeFeedsCount ?? 0) > 0).length;

  const skuLimit = quotas?.products?.max ?? license?.maxXmlLimit ?? 1000;
  const skuPercent =
    quotas?.products?.percentUsed ??
    (skuLimit > 0 ? Math.min(100, Math.round((productsCount / skuLimit) * 100)) : 0);

  return (
    <div
      data-testid="home-page"
      className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300"
    >
      {/* 1. Welcome & Quick Actions Bar */}
      <DashboardHeroBar
        userName={user?.fullName || user?.email}
        suppliersCount={suppliersCount}
        feedsCount={feedsCount}
        productsCount={productsCount}
      />

      {/* 2. Adaptive 4-Card KPI Grid (sm:grid-cols-2 xl:grid-cols-4) */}
      <DashboardKpiGrid
        productsCount={productsCount}
        suppliersCount={suppliersCount}
        activeSuppliersCount={activeSuppliersCount}
        suppliersWithFeedsCount={suppliersWithFeedsCount}
        feedsCount={feedsCount}
        totalRulesCount={totalRulesCount}
        skuLimit={skuLimit}
        skuPercent={skuPercent}
        planType={license?.planType || 'FREE'}
        quotas={quotas}
      />

      {/* 3. Middle Bento Grid: Sync Activity Chart + Workspace Readiness Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-7 xl:col-span-8">
          <FeedSyncActivityChart
            productsCount={productsCount}
            feedsCount={feedsCount}
            totalRulesCount={totalRulesCount}
          />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <DashboardReadinessCard
            suppliersCount={suppliersCount}
            feedsCount={feedsCount}
            productsCount={productsCount}
            totalRulesCount={totalRulesCount}
          />
        </div>
      </div>

      {/* 4. Bottom Bento Grid: Latest Suppliers + Active Feed Sources & Quotas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-7">
          <DashboardSuppliersCard suppliers={suppliersList} totalSuppliersCount={suppliersCount} />
        </div>
        <div className="lg:col-span-5">
          <DashboardFeedsAndQuotasCard
            feedSources={feedSources}
            productsCount={productsCount}
            suppliersCount={suppliersCount}
            feedsCount={feedsCount}
            skuLimit={skuLimit}
            quotas={quotas}
          />
        </div>
      </div>
    </div>
  );
}
