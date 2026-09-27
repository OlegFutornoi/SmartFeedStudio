import React from 'react';
import { PackagePlus, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTranslation } from '@/i18n';
import { useNavigate } from 'react-router-dom';

interface ProductsZeroStateCardProps {
  onOpenImportWizard: () => void;
  isFeedLimitReached?: boolean;
}

export const ProductsZeroStateCard: React.FC<ProductsZeroStateCardProps> = ({
  onOpenImportWizard,
  isFeedLimitReached = false,
}) => {
  const { t } = useTranslation(['catalogs', 'common']);
  const navigate = useNavigate();

  return (
    <Card
      data-testid="products-zero-state-card"
      className="p-10 sm:p-14 text-center border-dashed border-border/80 bg-card rounded-2xl shadow-xs animate-in fade-in zoom-in-95 duration-300"
    >
      <div className="flex flex-col items-center justify-center max-w-lg mx-auto space-y-4">
        {/* Semantic Icon Container */}
        <div className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs flex items-center justify-center">
          <PackagePlus className="h-10 w-10 text-primary" />
        </div>

        {/* Text Details */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {t('catalogs:zeroProductsTitle')}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t('catalogs:zeroProductsDesc')}
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            onClick={onOpenImportWizard}
            disabled={isFeedLimitReached}
            data-testid="zero-state-import-feed-btn"
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all"
            title={isFeedLimitReached ? t('catalogs:feedLimitReachedTooltip') : undefined}
          >
            <PackagePlus className="size-4" />
            <span>{t('catalogs:zeroProductsImportBtn')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/suppliers')}
            data-testid="zero-state-go-to-suppliers-btn"
            className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2.5 rounded-xl border-border hover:bg-secondary transition-all"
          >
            <Building2 className="size-4 text-muted-foreground" />
            <span>{t('catalogs:zeroProductsSupplierBtn')}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};
