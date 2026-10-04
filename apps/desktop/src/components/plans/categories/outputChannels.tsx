import { Check, Share2 } from 'lucide-react';
import type { FeatureCategory } from '@/components/plans/categories/shared';
import { boolCell, quotaCheckCell } from '@/components/plans/categories/shared';

/** Category 2: Output Export Channels */
export function buildOutputChannelsCategory(isUk: boolean): FeatureCategory {
  return {
    titleUk: '2. Вихідні канали експорту (Output Channels)',
    titleEn: '2. Output Export Channels',
    icon: Share2,
    rows: [
      {
        labelUk: 'Активні канали експорту',
        labelEn: 'Active Export Channels',
        getValue: (p) => (
          <span className="font-semibold text-foreground">
            {p.maxChannelsLimit >= 999999
              ? isUk
                ? 'Необмежено'
                : 'Unlimited'
              : isUk
                ? `До ${p.maxChannelsLimit} каналів`
                : `Up to ${p.maxChannelsLimit} channels`}
          </span>
        ),
      },
      {
        labelUk: 'Rozetka.ua XML',
        labelEn: 'Rozetka.ua XML',
        getValue: () => quotaCheckCell(isUk),
      },
      {
        labelUk: 'Prom.ua YML & Hotline / Price.ua',
        labelEn: 'Prom.ua YML & Hotline / Price.ua',
        getValue: () => quotaCheckCell(isUk),
      },
      {
        labelUk: 'Google Merchant Center & Facebook Catalog',
        labelEn: 'Google Merchant Center & Facebook Catalog',
        getValue: () => quotaCheckCell(isUk),
      },
      {
        labelUk: 'Кастомний XML / CSV (Власний мапінг тегів)',
        labelEn: 'Custom XML / CSV (Custom Tag Mapping)',
        getValue: () => (
          <span className="inline-flex items-center gap-1 text-foreground font-medium">
            <Check className="size-4 shrink-0" />
            <span className="text-[11px] text-muted-foreground">
              {isUk ? '(в межах ліміту)' : '(within quota)'}
            </span>
          </span>
        ),
      },
      {
        labelUk: 'Kasta.ua, Epicentr, Allo',
        labelEn: 'Kasta.ua, Epicentr, Allo',
        getValue: () => quotaCheckCell(isUk),
      },
      {
        labelUk: 'B2B Дилерські мульти-прайси (РРЦ/Опт/Дроп)',
        labelEn: 'B2B Dealer Price Lists (RRP/Wholesale/Drop)',
        getValue: (p) => boolCell(p.code === 'ENTERPRISE', isUk),
      },
    ],
  };
}
