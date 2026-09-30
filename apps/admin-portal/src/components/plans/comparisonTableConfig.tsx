import React from 'react';
import { Check, Minus, ArrowDownToLine, Share2, Cpu, ShieldCheck, LucideIcon } from 'lucide-react';
import { TariffPlanDto } from '@smartfeed/shared';

export interface FeatureRow {
  labelUk: string;
  labelEn: string;
  getValue: (plan: TariffPlanDto, isUk: boolean) => React.ReactNode;
}

export interface FeatureCategory {
  titleUk: string;
  titleEn: string;
  icon: LucideIcon;
  rows: FeatureRow[];
}

/** Reusable cell renderer for boolean check/minus features */
function boolCell(condition: boolean, isUk: boolean): React.ReactNode {
  return condition ? (
    <span className="inline-flex items-center gap-1 text-primary font-medium">
      <Check className="size-4 shrink-0" />
      <span>{isUk ? 'Включено' : 'Included'}</span>
    </span>
  ) : (
    <Minus className="size-4 text-muted-foreground/40 mx-auto" />
  );
}

/** Reusable cell renderer for "within quota" check */
function quotaCheckCell(isUk: boolean): React.ReactNode {
  return (
    <span className="inline-flex items-center gap-1 text-primary">
      <Check className="size-4 shrink-0" />
      <span className="text-[11px] text-muted-foreground">
        {isUk ? '(в межах ліміту)' : '(within quota)'}
      </span>
    </span>
  );
}

export function buildComparisonCategories(isUk: boolean): FeatureCategory[] {
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

    // 3. Ресурси та команда (Resources)
    {
      titleUk: '3. Ресурси та автоматизація (Resources & Automation)',
      titleEn: '3. Resources & Automation',
      icon: Cpu,
      rows: [
        {
          labelUk: 'Місць у команді',
          labelEn: 'Team Seats',
          getValue: (p) => (
            <span className="font-semibold">
              {p.maxTeamSeats >= 10
                ? isUk
                  ? '10+ місць'
                  : '10+ seats'
                : isUk
                  ? `${p.maxTeamSeats} користувач`
                  : `${p.maxTeamSeats} user`}
            </span>
          ),
        },
        {
          labelUk: 'Хмарне сховище S3 / Cloudflare R2',
          labelEn: 'S3 Cloud Storage / Cloudflare R2',
          getValue: (p) => (
            <span className="font-medium">
              {p.maxStorageGb === 0
                ? isUk
                  ? '0 GB (Офлайн)'
                  : '0 GB (Offline)'
                : `${p.maxStorageGb} GB`}
            </span>
          ),
        },
        {
          labelUk: 'Спільна синхронізація команди (Hub & Spoke)',
          labelEn: 'Team Collaboration (Hub & Spoke S3 Sync)',
          getValue: (p) => boolCell(p.maxTeamSeats > 1 || p.maxStorageGb >= 10, isUk),
        },
        {
          labelUk: 'AI Кредити на місяць',
          labelEn: 'AI Credits per month',
          getValue: (p) => (
            <span className="font-semibold text-foreground">
              {p.aiCredits.toLocaleString()} {isUk ? 'кредитів' : 'credits'}
            </span>
          ),
        },
        {
          labelUk: 'Частота авто-оновлення фідів',
          labelEn: 'Feed Auto-Sync Frequency',
          getValue: (p) => (
            <span className="font-medium">
              {p.syncFrequencyHours === 0
                ? isUk
                  ? 'Тільки вручну'
                  : 'Manual only'
                : p.syncFrequencyHours === 24
                  ? isUk
                    ? '1 раз на добу (24 год)'
                    : 'Once per day (24h)'
                  : p.syncFrequencyHours === 4
                    ? isUk
                      ? 'Кожні 4 години'
                      : 'Every 4 hours'
                    : isUk
                      ? 'Щогодини (1 год)'
                      : 'Hourly (1h)'}
            </span>
          ),
        },
      ],
    },

    // 4. B2B & Розширений функціонал (Advanced)
    {
      titleUk: '4. B2B & Розширений функціонал (Enterprise & Advanced)',
      titleEn: '4. Enterprise & Advanced Features',
      icon: ShieldCheck,
      rows: [
        {
          labelUk: 'Порівняння версій фіду (Feed Diff)',
          labelEn: 'Feed Version Comparison (Diff)',
          getValue: (p) => boolCell(p.hasFeedDiff, isUk),
        },
        {
          labelUk: 'REST API доступ',
          labelEn: 'REST API Access',
          getValue: (p) => boolCell(p.hasApiAccess, isUk),
        },
        {
          labelUk: 'Webhooks сповіщення',
          labelEn: 'Webhook Notifications',
          getValue: (p) => boolCell(p.hasWebhooks, isUk),
        },
        {
          labelUk: 'Підключення власного S3 (BYOS)',
          labelEn: 'Custom S3 Storage (BYOS)',
          getValue: (p) => boolCell(p.hasCustomS3, isUk),
        },
        {
          labelUk: 'Журнал аудиту дій (Audit Log)',
          labelEn: 'Full Audit Trail Log',
          getValue: (p) => boolCell(p.hasAuditLog, isUk),
        },
        {
          labelUk: 'White-label PDF звіти для клієнтів',
          labelEn: 'White-label PDF Client Reports',
          getValue: (p) => boolCell(p.hasWhiteLabel, isUk),
        },
        {
          labelUk: 'Договір, рахунки та акти для юросіб',
          labelEn: 'Corporate Contracts & Invoices',
          getValue: (p) => boolCell(p.priceMonthly > 0, isUk),
        },
        {
          labelUk: 'Рівень технічної підтримки',
          labelEn: 'Technical Support Level',
          getValue: (p) => (
            <span className="text-xs">
              {p.code === 'STARTER' || p.code === 'FREE'
                ? isUk
                  ? 'FAQ / Спільнота'
                  : 'FAQ / Community'
                : p.code === 'GROWTH'
                  ? isUk
                    ? 'Email (до 48 год)'
                    : 'Email (within 48h)'
                  : p.code === 'PRO'
                    ? isUk
                      ? 'Live Chat (до 8 год)'
                      : 'Live Chat (within 8h)'
                    : isUk
                      ? 'Персональний менеджер (до 2 год)'
                      : 'Dedicated Manager (within 2h)'}
            </span>
          ),
        },
        {
          labelUk: 'SLA Uptime гарантія',
          labelEn: 'SLA Uptime Guarantee',
          getValue: (p) =>
            p.slaUptimePercent ? (
              <span className="font-semibold text-primary">{p.slaUptimePercent}% Uptime</span>
            ) : (
              <span className="text-xs text-muted-foreground">Standard</span>
            ),
        },
      ],
    },
  ];
}
