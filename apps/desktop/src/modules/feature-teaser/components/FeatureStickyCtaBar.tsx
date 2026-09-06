import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';
import type { FeatureTeaserConfig } from '../types/feature-teaser.types';

interface FeatureStickyCtaBarProps {
  config: FeatureTeaserConfig;
}

export const FeatureStickyCtaBar: React.FC<FeatureStickyCtaBarProps> = ({ config }) => {
  const { t } = useTranslation(['featureTeaser']);
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate(`/plans?highlight=${config.minPlan}`);
  };

  const handleViewAllPlans = () => {
    navigate('/plans');
  };

  return (
    <div
      data-testid="feature-sticky-cta-bar"
      className="sticky bottom-0 z-20 bg-card border-t border-border shadow-xl p-4 transition-all duration-200"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Pricing & Guarantee */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span
              data-testid="cta-price-tag"
              className="text-lg md:text-xl font-extrabold text-foreground"
            >
              {t(config.cta.priceTextKey)}
            </span>
            <span className="text-xs text-muted-foreground">({config.badge})</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>{t('featureTeaser.common.guaranteeNotice')}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="cta-view-plans-btn"
            onClick={handleViewAllPlans}
            className="flex-1 sm:flex-none text-xs font-medium"
          >
            {t('featureTeaser.common.viewAllPlans')}
          </Button>

          <Button
            type="button"
            size="sm"
            data-testid="cta-upgrade-primary-btn"
            onClick={handleUpgrade}
            className="flex-1 sm:flex-none gap-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:scale-[1.02]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t(config.cta.buttonKey)}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
