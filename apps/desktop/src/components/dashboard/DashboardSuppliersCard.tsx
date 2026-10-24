import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Package,
  Rss,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';
import type { SupplierDto } from '@smartfeed/shared';

interface DashboardSuppliersCardProps {
  suppliers: SupplierDto[];
  totalSuppliersCount: number;
}

export const DashboardSuppliersCard = React.memo(function DashboardSuppliersCard({
  suppliers,
  totalSuppliersCount,
}: DashboardSuppliersCardProps) {
  const { t, language } = useTranslation(['home', 'common']);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'with_feeds' | 'no_feeds'>('all');

  const formatNum = (val: number) =>
    new Intl.NumberFormat(language === 'uk' ? 'uk-UA' : 'en-US').format(val);

  const filteredSuppliers = useMemo(() => {
    const list =
      filter === 'with_feeds'
        ? suppliers.filter((s) => (s.activeFeedsCount ?? 0) > 0)
        : filter === 'no_feeds'
          ? suppliers.filter((s) => (s.activeFeedsCount ?? 0) === 0)
          : suppliers;
    return list.slice(0, 5);
  }, [suppliers, filter]);

  return (
    <Card
      data-testid="latest-suppliers-section"
      className="border-border/60 bg-card shadow-2xs rounded-lg flex flex-col justify-between h-full"
    >
      <CardHeader className="pb-3 pt-4 px-4 space-y-2.5 border-b border-border/50 bg-muted/15">
        <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-foreground truncate">
                {t('latestSuppliersTitle')}
              </CardTitle>
              <Badge
                variant="outline"
                className="text-2xs font-mono tabular-nums px-1.5 py-0 h-4 rounded-sm bg-muted/50 text-muted-foreground border-border/60 shrink-0"
              >
                {t('showingCount', {
                  current: filteredSuppliers.length,
                  total: totalSuppliersCount,
                })}
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5 truncate">
              {t('latestSuppliersDesc')}
            </CardDescription>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/suppliers')}
            className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground gap-1 rounded-md shrink-0 cursor-pointer"
          >
            <span>{t('viewAllSuppliers')}</span>
            <ArrowUpRight className="size-3.5" />
          </Button>
        </div>

        {/* Inline filter toolbar (UI-15) */}
        {suppliers.length > 0 && (
          <div className="flex items-center gap-1 pt-0.5">
            {(
              [
                { key: 'all', label: t('filterAll') },
                { key: 'with_feeds', label: t('filterWithFeeds') },
                { key: 'no_feeds', label: t('filterNoFeeds') },
              ] as const
            ).map((tab) => (
              <Button
                key={tab.key}
                type="button"
                variant={filter === tab.key ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilter(tab.key)}
                className="h-6 text-2xs px-2 font-medium rounded-sm cursor-pointer"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-3 flex-1">
        {suppliers.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <Truck className="size-6 text-muted-foreground/50 mx-auto" />
            <p className="text-muted-foreground text-xs">{t('noSuppliers')}</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-xs">
            {t('noSuppliersFilter')}
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filteredSuppliers.map((supplier) => {
              const feedsCount = supplier.activeFeedsCount ?? 0;
              const productsCount = supplier.productsCount ?? 0;

              return (
                <Button
                  key={supplier.id}
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/suppliers')}
                  className="group w-full h-auto flex flex-col sm:flex-row sm:items-center justify-between py-2.5 px-2.5 first:pt-2 last:pb-2 gap-2.5 hover:bg-muted/35 rounded-md transition-colors text-left font-normal cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-md bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground group-hover:text-foreground shrink-0 mt-0.5 sm:mt-0">
                      <Truck className="size-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="font-medium text-xs sm:text-sm text-foreground truncate">
                          {supplier.name}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-2xs h-4 px-1 py-0 uppercase font-mono rounded-sm border-border/60 text-muted-foreground shrink-0"
                        >
                          {supplier.code}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-2xs text-muted-foreground">
                        <span className="flex items-center gap-1 tabular-nums">
                          <Package className="size-3 text-muted-foreground" />
                          {t('productsCount', { count: formatNum(productsCount) })}
                        </span>
                        <span className="flex items-center gap-1 tabular-nums">
                          <Rss className="size-3 text-muted-foreground" />
                          {t('feedsCount', { count: feedsCount })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                    {feedsCount === 0 && (
                      <Badge
                        variant="outline"
                        className="text-2xs px-1.5 py-0 h-5 rounded-sm bg-muted/40 border-border/60 text-muted-foreground flex items-center gap-1"
                      >
                        <AlertCircle className="size-2.5" />
                        <span>{t('needsFeedBadge')}</span>
                      </Badge>
                    )}

                    {supplier.isActive ? (
                      <Badge
                        variant="outline"
                        className="text-2xs px-1.5 py-0 h-5 rounded-sm bg-success/15 text-success border-success/30 flex items-center gap-1"
                      >
                        <CheckCircle2 className="size-2.5" />
                        <span>{t('statusActive')}</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-2xs px-1.5 py-0 h-5 rounded-sm bg-muted text-muted-foreground flex items-center gap-1"
                      >
                        <XCircle className="size-2.5" />
                        <span>{t('statusInactive')}</span>
                      </Badge>
                    )}

                    <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
                  </div>
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
