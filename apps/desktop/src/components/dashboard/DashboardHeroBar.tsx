import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Rss, Layers, Sparkles, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

interface DashboardHeroBarProps {
  userName?: string | null;
  suppliersCount: number;
  feedsCount: number;
  productsCount: number;
}

export const DashboardHeroBar = React.memo(function DashboardHeroBar({
  userName,
  suppliersCount,
  feedsCount,
  productsCount,
}: DashboardHeroBarProps) {
  const { t, language } = useTranslation(['home', 'common']);
  const navigate = useNavigate();

  const displayName = userName?.trim() || t('defaultUserName');
  const formattedProducts = new Intl.NumberFormat(language === 'uk' ? 'uk-UA' : 'en-US').format(
    productsCount,
  );

  let subtitle = t('heroSubtitleEmpty');
  if (suppliersCount > 0 && feedsCount === 0) {
    subtitle = t('heroSubtitleNoFeeds', { suppliers: suppliersCount });
  } else if (feedsCount > 0) {
    subtitle = t('heroSubtitleActive', {
      products: formattedProducts,
      feeds: feedsCount,
      suppliers: suppliersCount,
    });
  }

  return (
    <div
      data-testid="dashboard-hero-bar"
      className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-lg border border-border/60 bg-card px-4 py-3.5 shadow-2xs"
    >
      <div className="min-w-0 space-y-0.5">
        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground truncate text-balance">
          {t('welcomeBack', { name: displayName })}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Singular primary CTA (UI-13) */}
        <Button
          size="sm"
          onClick={() => navigate('/suppliers')}
          className="h-8 text-xs font-medium px-3 gap-1.5 rounded-md cursor-pointer"
          data-testid="dashboard-primary-cta"
        >
          {suppliersCount === 0 ? (
            <>
              <Plus className="size-3.5" />
              <span>{t('actionAddSupplier')}</span>
            </>
          ) : (
            <>
              <Rss className="size-3.5" />
              <span>{t('actionConnectFeed')}</span>
            </>
          )}
        </Button>

        {/* Subordinate quick actions (UI-13) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/catalogs')}
          className="h-8 text-xs font-medium px-2.5 gap-1.5 rounded-md border-border/60 bg-background hover:bg-muted/50 cursor-pointer"
        >
          <Layers className="size-3.5 text-muted-foreground" />
          <span>{t('actionOpenCatalog')}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/ai-enrichment')}
          className="h-8 text-xs font-medium px-2.5 gap-1.5 rounded-md border-border/60 bg-background hover:bg-muted/50 cursor-pointer"
        >
          <Sparkles className="size-3.5 text-muted-foreground" />
          <span>{t('actionAiEnrichment')}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/cloud-sync')}
          className="h-8 text-xs font-medium px-2.5 gap-1.5 rounded-md border-border/60 bg-background hover:bg-muted/50 cursor-pointer hidden sm:inline-flex"
        >
          <Cloud className="size-3.5 text-muted-foreground" />
          <span>{t('actionCloudSync')}</span>
        </Button>
      </div>
    </div>
  );
});
