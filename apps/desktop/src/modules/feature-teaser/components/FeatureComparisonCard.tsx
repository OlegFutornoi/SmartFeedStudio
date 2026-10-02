import React from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import type { FeatureTeaserConfig } from '@/modules/feature-teaser/types/feature-teaser.types';

interface FeatureComparisonCardProps {
  config: FeatureTeaserConfig;
}

export const FeatureComparisonCard: React.FC<FeatureComparisonCardProps> = ({ config }) => {
  const { t } = useTranslation(['featureTeaser']);

  const { comparison } = config;

  return (
    <div
      data-testid="feature-comparison-card"
      className="space-y-4 rounded-xl border border-border/80 bg-card p-5 shadow-xs"
    >
      <h3
        data-testid="feature-comparison-title"
        className="text-base font-semibold text-foreground tracking-tight"
      >
        {t(comparison.titleKey)}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Starter Plan Column */}
        <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t(comparison.starterTitleKey)}
            </span>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              {t('featureTeaser.common.currentPlanBadge', { defaultValue: 'Поточний' })}
            </Badge>
          </div>

          <div className="space-y-2 pt-1">
            {comparison.starterFeaturesKeys.map((key, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                <X className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                <span>{t(key)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Target PRO Plan Column */}
        <div className="p-4 rounded-xl border-2 border-primary/40 bg-primary/5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t(comparison.targetTitleKey)}</span>
            </span>
            <Badge className="text-[10px] bg-primary text-primary-foreground font-semibold">
              {t('featureTeaser.common.recommendedBadge', { defaultValue: 'Рекомендовано' })}
            </Badge>
          </div>

          <div className="space-y-2 pt-1">
            {comparison.targetFeaturesKeys.map((key, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 text-xs font-medium text-foreground"
              >
                <Check className="h-3.5 w-3.5 text-foreground shrink-0 mt-0.5" />
                <span>{t(key)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
