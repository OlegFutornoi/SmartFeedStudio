import React, { useState, useMemo } from 'react';
import { Calculator, Clock, Coins } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { FeatureRoiConfig } from '@/modules/feature-teaser/types/feature-teaser.types';

interface FeatureRoiWidgetProps {
  roiConfig?: FeatureRoiConfig;
  featureKey: string;
}

export const FeatureRoiWidget: React.FC<FeatureRoiWidgetProps> = ({ roiConfig, featureKey }) => {
  const { t } = useTranslation(['featureTeaser']);

  const config: FeatureRoiConfig = roiConfig || {
    defaultHours: 8,
    minHours: 2,
    maxHours: 40,
    hourlyRateUah: 200,
    efficiencyMultiplier: 0.8,
  };

  const [hoursPerWeek, setHoursPerWeek] = useState<number>(config.defaultHours);

  // Calculations:
  // monthly hours saved = (hours per week * 4 weeks) * efficiencyMultiplier
  const monthlyHoursSaved = Math.round(hoursPerWeek * 4 * config.efficiencyMultiplier);
  // monthly money saved = monthly hours saved * hourly rate
  const monthlyMoneySaved = monthlyHoursSaved * config.hourlyRateUah;

  const roiKeys = useMemo(() => {
    switch (featureKey) {
      case 'team':
        return {
          title: 'featureTeaser.team.roi.title' as const,
          subtitle: 'featureTeaser.team.roi.subtitle' as const,
          sliderLabel: 'featureTeaser.team.roi.sliderLabel' as const,
          hoursSavedLabel: 'featureTeaser.team.roi.hoursSavedLabel' as const,
          moneySavedLabel: 'featureTeaser.team.roi.moneySavedLabel' as const,
        };
      case 'cloud_sync':
        return {
          title: 'featureTeaser.cloudSync.roi.title' as const,
          subtitle: 'featureTeaser.cloudSync.roi.subtitle' as const,
          sliderLabel: 'featureTeaser.cloudSync.roi.sliderLabel' as const,
          hoursSavedLabel: 'featureTeaser.cloudSync.roi.hoursSavedLabel' as const,
          moneySavedLabel: 'featureTeaser.cloudSync.roi.moneySavedLabel' as const,
        };
      case 'ai_enrichment':
      default:
        return {
          title: 'featureTeaser.aiEnrichment.roi.title' as const,
          subtitle: 'featureTeaser.aiEnrichment.roi.subtitle' as const,
          sliderLabel: 'featureTeaser.aiEnrichment.roi.sliderLabel' as const,
          hoursSavedLabel: 'featureTeaser.aiEnrichment.roi.hoursSavedLabel' as const,
          moneySavedLabel: 'featureTeaser.aiEnrichment.roi.moneySavedLabel' as const,
        };
    }
  }, [featureKey]);

  return (
    <div
      data-testid="feature-roi-widget"
      className="space-y-4 rounded-xl border border-border/80 bg-card p-5 shadow-xs"
    >
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-muted border border-border text-foreground flex items-center justify-center">
          <Calculator className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">{t(roiKeys.title)}</h3>
          <p className="text-xs text-muted-foreground">{t(roiKeys.subtitle)}</p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">{t(roiKeys.sliderLabel)}</span>
          <span
            data-testid="roi-slider-value"
            className="font-bold text-primary text-sm bg-primary/10 px-2 py-0.5 rounded-md"
          >
            {hoursPerWeek}{' '}
            {t('featureTeaser.common.hoursPerWeekUnit', { defaultValue: 'год/тиждень' })}
          </span>
        </div>

        <input
          type="range"
          data-testid="roi-hours-slider"
          min={config.minHours}
          max={config.maxHours}
          step={1}
          value={hoursPerWeek}
          onChange={(e) => setHoursPerWeek(Number(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />

        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>
            {config.minHours} {t('featureTeaser.common.hoursUnit', { defaultValue: 'год' })}
          </span>
          <span>
            {config.maxHours / 2} {t('featureTeaser.common.hoursUnit', { defaultValue: 'год' })}
          </span>
          <span>
            {config.maxHours} {t('featureTeaser.common.hoursUnit', { defaultValue: 'год' })}
          </span>
        </div>
      </div>

      {/* Calculated Results Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div className="p-3.5 rounded-lg border border-border/70 bg-muted/20 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">{t(roiKeys.hoursSavedLabel)}</div>
            <div data-testid="roi-hours-saved-result" className="text-lg font-bold text-foreground">
              ~{monthlyHoursSaved} {t('featureTeaser.common.hoursPerMonth')}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-muted/40 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-muted border border-border text-foreground flex items-center justify-center shrink-0">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">{t(roiKeys.moneySavedLabel)}</div>
            <div
              data-testid="roi-money-saved-result"
              className="text-lg font-bold text-foreground font-mono"
            >
              ~{monthlyMoneySaved.toLocaleString()} {t('featureTeaser.common.currencyPerMonth')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
