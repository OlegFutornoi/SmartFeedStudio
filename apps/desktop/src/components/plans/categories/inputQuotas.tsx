import { ArrowDownToLine } from 'lucide-react';
import type { FeatureCategory } from '@/components/plans/categories/shared';
import { boolCell } from '@/components/plans/categories/shared';

/** Category 1: Input Quotas */
export function buildInputQuotasCategory(isUk: boolean): FeatureCategory {
  return {
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
  };
}
