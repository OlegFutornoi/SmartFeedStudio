import React from 'react';
import {
  Users,
  ShieldCheck,
  Sparkles,
  History,
  CloudUpload,
  RotateCcw,
  Laptop,
  Server,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { FeatureBenefitItem } from '../types/feature-teaser.types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  ShieldCheck,
  Sparkles,
  History,
  CloudUpload,
  RotateCcw,
  Laptop,
  Server,
};

interface FeatureBenefitsGridProps {
  titleKey: string;
  benefits: FeatureBenefitItem[];
}

export const FeatureBenefitsGrid: React.FC<FeatureBenefitsGridProps> = ({ titleKey, benefits }) => {
  const { t } = useTranslation(['featureTeaser']);

  return (
    <div data-testid="feature-benefits-grid" className="space-y-4">
      <h2
        data-testid="feature-benefits-title"
        className="text-lg font-semibold text-foreground tracking-tight"
      >
        {t(titleKey)}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map((item) => {
          const IconComponent = ICON_MAP[item.iconName] || CheckCircle2;
          const title = t(item.titleKey);
          const desc = t(item.descKey);

          return (
            <div
              key={item.id}
              data-testid={`benefit-card-${item.id}`}
              className="flex items-start gap-3.5 p-4 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <IconComponent className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{title}</div>
                <div className="text-xs text-muted-foreground leading-normal">{desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
