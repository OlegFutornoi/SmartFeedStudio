import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Package,
  Rss,
  Plus,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuotas } from '@/contexts/QuotasContext';
import { useTranslation } from '@/i18n';
import { useDataSync } from '@/lib/syncEvents';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SupplierDto } from '@smartfeed/shared';
import { getSuppliers } from '@/lib/api';
import { FeedSyncActivityChart } from '@/components/dashboard/FeedSyncActivityChart';

export function HomePage() {
  const { user, token } = useAuth();
  const { quotas } = useQuotas();
  const { t, language } = useTranslation(['home', 'common']);
  const navigate = useNavigate();

  const [latestSuppliers, setLatestSuppliers] = useState<SupplierDto[]>([]);
  const [totalSuppliersDB, setTotalSuppliersDB] = useState<number>(0);

  const loadSuppliers = useCallback(async () => {
    try {
      const suppliers = await getSuppliers(token || undefined);
      setTotalSuppliersDB(suppliers.length);
      // Get first 3 as "latest"
      setLatestSuppliers(suppliers.slice(0, 3));
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  useDataSync(['suppliers', 'all'], loadSuppliers);

  const suppliersCount = quotas?.suppliers?.used ?? 0;
  const productsCount = quotas?.products?.used ?? 0;
  const feedsCount = quotas?.feeds?.used ?? 0;

  const skuLimit = quotas?.products?.max ?? 1000;
  const skuPercent = quotas?.products?.percentUsed ?? 0;

  return (
    <div
      data-testid="home-page"
      className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300"
    >
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t('dashboardTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('welcomeBack', { name: user?.fullName || user?.email || 'User' })}
          </p>
        </div>

        <Button
          onClick={() => navigate('/suppliers')}
          data-testid="add-supplier-button"
          className="gap-2 shadow-xs self-start sm:self-auto"
        >
          <Plus className="size-4" />
          <span>{t('addSupplier')}</span>
        </Button>
      </div>

      {/* Stats Grid: dashboard-01 4-Column Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total Products */}
        <Card className="border-border/80 bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs hover:border-primary/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalProducts')}
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="text-[11px] font-medium px-1.5 py-0 rounded-md border-primary/30 text-primary bg-primary/5 flex items-center gap-1"
              >
                <TrendingUp className="size-3" />
                <span>+100%</span>
              </Badge>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Package className="size-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
              {new Intl.NumberFormat(language === 'uk' ? 'uk-UA' : 'en-US').format(productsCount)}
            </div>
          </CardContent>
          <CardFooter className="pt-0 pb-3 text-xs text-muted-foreground">
            <p>{t('totalProductsDesc')}</p>
          </CardFooter>
        </Card>

        {/* 2. Total Suppliers */}
        <Card className="border-border/80 bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs hover:border-primary/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalSuppliers')}
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
              {suppliersCount}
            </div>
          </CardContent>
          <CardFooter className="pt-0 pb-3 text-xs text-muted-foreground">
            <p>{t('totalSuppliersDesc')}</p>
          </CardFooter>
        </Card>

        {/* 3. Export Feeds */}
        <Card className="border-border/80 bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs hover:border-primary/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalFeeds')}
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Rss className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
              {feedsCount}
            </div>
          </CardContent>
          <CardFooter className="pt-0 pb-3 text-xs text-muted-foreground">
            <p>{t('totalFeedsDesc')}</p>
          </CardFooter>
        </Card>

        {/* 4. SKU Quota Usage */}
        <Card className="border-border/80 bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs hover:border-primary/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('skuUtilization')}
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="text-[11px] font-medium px-1.5 py-0 rounded-md border-primary/30 text-primary bg-primary/5 flex items-center gap-1"
              >
                <Sparkles className="size-3" />
                <span>{skuPercent}%</span>
              </Badge>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Layers className="size-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
              {skuPercent}%
            </div>
          </CardContent>
          <CardFooter className="pt-0 pb-3 text-xs text-muted-foreground">
            <p>{t('skuLimitText', { limit: skuLimit.toLocaleString() })}</p>
          </CardFooter>
        </Card>
      </div>

      {/* Interactive Sync Activity Chart (dashboard-01) */}
      <FeedSyncActivityChart productsCount={productsCount} feedsCount={feedsCount} />

      {/* Latest Suppliers Section */}
      <Card data-testid="latest-suppliers-section" className="border-border/80 bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              {t('latestSuppliersTitle')}
            </CardTitle>
            <CardDescription className="text-xs">{t('latestSuppliersDesc')}</CardDescription>
          </div>
          <Badge
            variant="outline"
            className="text-xs bg-primary/5 text-primary border-primary/20 rounded-md"
          >
            {t('showingCount', { current: latestSuppliers.length, total: totalSuppliersDB })}
          </Badge>
        </CardHeader>

        <CardContent>
          <div className="divide-y divide-border/40">
            {latestSuppliers.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                {t('noSuppliers')}
              </div>
            ) : (
              latestSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-4 first:pt-0 last:pb-0 gap-3 hover:bg-muted/30 px-2 rounded-md transition-colors cursor-pointer"
                  onClick={() => navigate('/suppliers')}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground">{supplier.name}</p>
                      <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 uppercase">
                        {supplier.code}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Package className="size-3.5 text-primary" />
                        {t('productsCount', { count: supplier.productsCount ?? 0 })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Rss className="size-3.5 text-primary" />
                        {t('feedsCount', { count: supplier.activeFeedsCount ?? 0 })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {supplier.isActive ? (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-primary/10 text-primary border border-primary/20"
                      >
                        <CheckCircle2 className="size-3 mr-1" />
                        {t('statusActive')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                        <XCircle className="size-3 mr-1" />
                        {t('statusInactive')}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
