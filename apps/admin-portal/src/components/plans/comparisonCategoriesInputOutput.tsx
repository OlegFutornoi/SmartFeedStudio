import React from 'react';
import { ArrowDownToLine, Share2 } from 'lucide-react';
import { Check } from 'lucide-react';
import {
  FeatureCategory,
  boolCell,
  quotaCheckCell,
} from '@/components/plans/comparisonCellRenderers';

export function getInputOutputCategories(isUk: boolean): FeatureCategory[] {
  return [
    // 1. Вхідні ліміти (Input)
    {
      titleUk: '1. Вхідні ліміти (Input Quotas)',
      titleEn: '1. Input Quotas',
      icon: ArrowDownToLine,
      rows: [
        {
          labelUk: 'Кількість товарів (SKU)',
          labelEn: 'Product SKU Limit',
          getValue: (p) => (
            <span className="font-semibold text-foreground">
              {p.maxXmlLimit >= 500000
                ? isUk
                  ? '500 000+ (Безліміт)'
                  : '500,000+ (Unlimited)'
                : `${p.maxXmlLimit.toLocaleString()} SKU`}
            </span>
          ),
        },
        {
          labelUk: 'Кількість постачальників',
          labelEn: 'Connected Suppliers',
          getValue: (p) => (
            <span className="font-medium">
              {p.maxSuppliersLimit >= 999999
                ? isUk
                  ? 'Необмежено'
                  : 'Unlimited'
                : isUk
                  ? `До ${p.maxSuppliersLimit}`
                  : `Up to ${p.maxSuppliersLimit}`}
            </span>
          ),
        },
        {
          labelUk: 'Вхідні файли / посилання (URL)',
          labelEn: 'Inbound Feeds / URLs',
          getValue: (p) => (
            <span>
              {p.maxFeedsLimit >= 999999
                ? isUk
                  ? 'Необмежено'
                  : 'Unlimited'
                : isUk
                  ? `До ${p.maxFeedsLimit} фідів`
                  : `Up to ${p.maxFeedsLimit} feeds`}
            </span>
          ),
        },
        {
          labelUk: 'Авто-зіставлення за EAN / Артикулом',
          labelEn: 'Auto-matching by EAN / SKU',
          getValue: (p) => boolCell(p.maxSuppliersLimit > 1, isUk),
        },
        {
          labelUk: 'Вибір найкращої закупівельної ціни',
          labelEn: 'Best Wholesale Price Selection',
          getValue: (p) => boolCell(p.maxSuppliersLimit > 1, isUk),
        },
        {
          labelUk: 'Індивідуальні націнки за постачальником',
          labelEn: 'Per-Supplier Markup Rules',
          getValue: (p) => boolCell(p.maxSuppliersLimit > 1, isUk),
        },
        {
          labelUk: 'Пряме API підключення залишків дилера',
          labelEn: 'Direct Dealer API Inventory Sync',
          getValue: (p) => boolCell(p.code === 'ENTERPRISE' || p.maxSuppliersLimit >= 999999, isUk),
        },
      ],
    },

    // 2. Вихідні канали (Output)
    {
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
            <span className="inline-flex items-center gap-1 text-primary font-medium">
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
    },
  ];
}
