import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Package, Rss, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuotas } from '@/contexts/QuotasContext';
import { useTranslation } from '@/i18n';
import { useDataSync } from '@/lib/syncEvents';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SupplierDto } from '@smartfeed/shared';
import { getSuppliers } from '@/lib/api';

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
          className="gap-2 shadow-md shadow-primary/25 self-start sm:self-auto"
        >
          <Plus className="size-4" />
          <span>{t('addSupplier')}</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/40 bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalSuppliers')}</CardTitle>
            <div className="p-2 rounded-md bg-blue-500/10 text-blue-500">
              <Building2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {suppliersCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('totalSuppliersDesc')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalProducts')}</CardTitle>
            <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-500">
              <Package className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>
                {new Intl.NumberFormat(language === 'uk' ? 'uk-UA' : 'en-US').format(productsCount)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('totalProductsDesc')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalFeeds')}</CardTitle>
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <Rss className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">{feedsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('totalFeedsDesc')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Latest Suppliers Section */}
      <Card data-testid="latest-suppliers-section" className="border-border/40 bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              {t('latestSuppliersTitle')}
            </CardTitle>
            <CardDescription className="text-xs">{t('latestSuppliersDesc')}</CardDescription>
          </div>
          <Badge
            variant="outline"
            className="text-xs bg-primary/10 text-primary border-primary/20 rounded-md"
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
                        <Package className="size-3.5 text-emerald-500" />
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
                        className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
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
