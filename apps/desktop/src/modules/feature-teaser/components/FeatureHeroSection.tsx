import React from 'react';
import { Sparkles, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import type { FeatureTeaserConfig } from '../types/feature-teaser.types';

interface FeatureHeroSectionProps {
  config: FeatureTeaserConfig;
}

export const FeatureHeroSection: React.FC<FeatureHeroSectionProps> = ({ config }) => {
  const { t } = useTranslation(['featureTeaser', 'common']);

  const badgeText = t(config.heroBadgeKey, { plan: config.badge });
  const heroTitle = t(config.heroTitleKey);
  const heroSubtitle = t(config.heroSubtitleKey);

  return (
    <div
      data-testid="feature-hero-section"
      className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card/90 to-background p-6 md:p-8 shadow-xs"
    >
      <div className="flex flex-col items-start gap-4 max-w-3xl">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            data-testid="feature-hero-plan-badge"
            variant="default"
            className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground shadow-xs flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{badgeText}</span>
          </Badge>

          <Badge
            data-testid="feature-hero-interactive-badge"
            variant="outline"
            className="px-2.5 py-0.5 text-xs font-medium border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 flex items-center gap-1.5"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>{t('featureTeaser.common.interactivePreviewBadge')}</span>
          </Badge>
        </div>

        {/* Title and subtitle */}
        <div className="space-y-2">
          <h1
            data-testid="feature-hero-title"
            className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
          >
            {heroTitle}
          </h1>
          <p
            data-testid="feature-hero-subtitle"
            className="text-sm md:text-base text-muted-foreground leading-relaxed"
          >
            {heroSubtitle}
          </p>
        </div>
      </div>
    </div>
  );
};
