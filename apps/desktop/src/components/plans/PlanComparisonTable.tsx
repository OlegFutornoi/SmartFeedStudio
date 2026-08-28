'use client';

import React from 'react';
import {
  Check,
  Minus,
  Sparkles,
  Zap,
  AlertTriangle,
  Loader2,
  ArrowDownToLine,
  Share2,
  Cpu,
  ShieldCheck,
  LucideIcon,
} from 'lucide-react';
import type { TariffPlanDto, BillingInterval } from '@smartfeed/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';

interface PlanComparisonTableProps {
  plans: TariffPlanDto[];
  currentPlanCode?: string | null;
  billingInterval?: BillingInterval;
  isExpired?: boolean;
  isLoadingPlanCode?: string | null;
  isInvitedMember?: boolean;
  onSelect: (planCode: string, billingInterval?: BillingInterval) => void;
}

interface FeatureRow {
  labelUk: string;
  labelEn: string;
  getValue: (plan: TariffPlanDto, isUk: boolean) => React.ReactNode;
}

interface FeatureCategory {
  titleUk: string;
  titleEn: string;
  icon: LucideIcon;
  rows: FeatureRow[];
}

export function PlanComparisonTable({
  plans,
  currentPlanCode,
  billingInterval = 'monthly',
  isExpired = false,
  isLoadingPlanCode = null,
  isInvitedMember = false,
  onSelect,
}: PlanComparisonTableProps) {
  const { t, language } = useTranslation(['plans', 'common']);
  const isUk = language === 'uk';
  const isYearly = billingInterval === 'yearly';

  // Sort plans by order
  const sortedPlans = [...plans].sort((a, b) => a.order - b.order);

  const categories: FeatureCategory[] = [
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
          getValue: (p) =>
            p.maxSuppliersLimit > 1 ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="size-4 shrink-0" />
                <span>{isUk ? 'Включено' : 'Included'}</span>
              </span>
            ) : (
              <Minus className="size-4 text-muted-foreground/40 mx-auto" />
            ),
        },
        {
          labelUk: 'Вибір найкращої закупівельної ціни',
          labelEn: 'Best Wholesale Price Selection',
          getValue: (p) =>
            p.maxSuppliersLimit > 1 ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="size-4 shrink-0" />
                <span>{isUk ? 'Включено' : 'Included'}</span>
              </span>
            ) : (
              <Minus className="size-4 text-muted-foreground/40 mx-auto" />
            ),
        },
        {
          labelUk: 'Індивідуальні націнки за постачальником',
          labelEn: 'Per-Supplier Markup Rules',
          getValue: (p) =>
            p.maxSuppliersLimit > 1 ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="size-4 shrink-0" />
                <span>{isUk ? 'Включено' : 'Included'}</span>
              </span>
            ) : (
              <Minus className="size-4 text-muted-foreground/40 mx-auto" />
            ),
        },
        {
          labelUk: 'Пряме API підключення залишків дилера',
          labelEn: 'Direct Dealer API Inventory Sync',
          getValue: (p) =>
            p.code === 'ENTERPRISE' || p.maxSuppliersLimit >= 999999 ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="size-4 shrink-0" />
                <span>{isUk ? 'Включено' : 'Included'}</span>
              </span>
            ) : (
              <Minus className="size-4 text-muted-foreground/40 mx-auto" />
            ),
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
          getValue: () => (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Check className="size-4 shrink-0" />
              <span className="text-[11px] text-muted-foreground">
                {isUk ? '(в межах ліміту)' : '(within quota)'}
              </span>
            </span>
          ),
        },
        {
          labelUk: 'Prom.ua YML & Hotline / Price.ua',
          labelEn: 'Prom.ua YML & Hotline / Price.ua',
          getValue: () => (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Check className="size-4 shrink-0" />
              <span className="text-[11px] text-muted-foreground">
                {isUk ? '(в межах ліміту)' : '(within quota)'}
              </span>
            </span>
          ),
        },
        {
          labelUk: 'Google Merchant Center & Facebook Catalog',
          labelEn: 'Google Merchant Center & Facebook Catalog',
          getValue: () => (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Check className="size-4 shrink-0" />
              <span className="text-[11px] text-muted-foreground">
                {isUk ? '(в межах ліміту)' : '(within quota)'}
              </span>
            </span>
          ),
        },
        {
          labelUk: 'Кастомний XML / CSV (Власний мапінг тегів)',
          labelEn: 'Custom XML / CSV (Custom Tag Mapping)',
          getValue: () => (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
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
          getValue: () => (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Check className="size-4 shrink-0" />
              <span className="text-[11px] text-muted-foreground">
                {isUk ? '(в межах ліміту)' : '(within quota)'}
              </span>
            </span>
          ),
        },
        {
          labelUk: 'B2B Дилерські мульти-прайси (РРЦ/Опт/Дроп)',
          labelEn: 'B2B Dealer Price Lists (RRP/Wholesale/Drop)',
          getValue: (p) =>
            p.code === 'ENTERPRISE' ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="size-4 shrink-0" />
                <span>{isUk ? 'Включено' : 'Included'}</span>
              </span>
            ) : (
              <Minus className="size-4 text-muted-foreground/40 mx-auto" />
            ),
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
          getValue: (p) =>
            p.maxTeamSeats > 1 || p.maxStorageGb >= 10 ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="size-4 shrink-0" />
                <span>{isUk ? 'Включено' : 'Included'}</span>
              </span>
            ) : (
              <Minus className="size-4 text-muted-foreground/40 mx-auto" />
            ),
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
          getValue: (p) =>
            p.hasFeedDiff ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="size-4 shrink-0" />
                <span>{isUk ? 'Включено' : 'Included'}</span>
              </span>
            ) : (
              <Minus className="size-4 text-muted-foreground/40 mx-auto" />
            ),
        },
        {
          labelUk: 'REST API доступ',
          labelEn: 'REST API Access',
          getValue: (p) =>
            p.hasApiAccess ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="size-4 shrink-0" />
                <span>{isUk ? 'Включено' : 'Included'}</span>
              </span>
            ) : (
              <Minus className="size-4 text-muted-foreground/40 mx-auto" />
            ),
        },
        {
          labelUk: 'Webhooks сповіщення',
          labelEn: 'Webhook Notifications',
          getValue: (p) =>
            p.hasWebhooks ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="size-4 shrink-0" />
                <span>{isUk ? 'Включено' : 'Included'}</span>
              </span>
            ) : (
              <Minus className="size-4 text-muted-foreground/40 mx-auto" />
            ),
        },
        {
          labelUk: 'Підключення власного S3 (BYOS)',
          labelEn: 'Custom S3 Storage (BYOS)',
          getValue: (p) =>
            p.hasCustomS3 ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="size-4 shrink-0" />
                <span>{isUk ? 'Включено' : 'Included'}</span>
              </span>
            ) : (
              <Minus className="size-4 text-muted-foreground/40 mx-auto" />
            ),
        },
        {
          labelUk: 'Журнал аудиту дій (Audit Log)',
          labelEn: 'Full Audit Trail Log',
          getValue: (p) =>
            p.hasAuditLog ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="size-4 shrink-0" />
                <span>{isUk ? 'Включено' : 'Included'}</span>
              </span>
            ) : (
              <Minus className="size-4 text-muted-foreground/40 mx-auto" />
            ),
        },
        {
          labelUk: 'White-label PDF звіти для клієнтів',
          labelEn: 'White-label PDF Client Reports',
          getValue: (p) =>
            p.hasWhiteLabel ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="size-4 shrink-0" />
                <span>{isUk ? 'Включено' : 'Included'}</span>
              </span>
            ) : (
              <Minus className="size-4 text-muted-foreground/40 mx-auto" />
            ),
        },
        {
          labelUk: 'Договір, рахунки та акти для юросіб',
          labelEn: 'Corporate Contracts & Invoices',
          getValue: (p) =>
            p.priceMonthly > 0 ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="size-4 shrink-0" />
                <span>{isUk ? 'Включено' : 'Included'}</span>
              </span>
            ) : (
              <Minus className="size-4 text-muted-foreground/40 mx-auto" />
            ),
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
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {p.slaUptimePercent}% Uptime
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Standard</span>
            ),
        },
      ],
    },
  ];

  return (
    <div
      data-testid="plans-comparison-table-container"
      className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-sm"
    >
      <table className="w-full text-left border-collapse text-xs">
        {/* Sticky Table Header */}
        <thead>
          <tr className="border-b border-border bg-muted/40 divide-x divide-border/60">
            <th className="p-4 w-[28%] min-w-[220px] font-semibold text-foreground align-bottom">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold">{t('plans.featuresTitle')}</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  {t('plans.comparisonSubtitle')}
                </span>
              </div>
            </th>

            {sortedPlans.map((plan) => {
              const name = isUk ? plan.nameUk : plan.nameEn;
              const currencySymbol = plan.currency === 'UAH' ? 'грн' : '$';
              const isPro = plan.code === 'PRO' || plan.isPopular;
              const isCurrent = currentPlanCode === plan.code;
              const isLoading = isLoadingPlanCode === plan.code;
              const hasYearlyOption = Boolean(plan.priceYearly && plan.priceYearly > 0);

              const displayMonthlyPrice =
                isYearly && hasYearlyOption
                  ? Math.round(plan.priceYearly! / 12)
                  : plan.priceMonthly;

              return (
                <th
                  key={plan.id}
                  data-testid={`comparison-header-${plan.code.toLowerCase()}`}
                  className={cn(
                    'p-4 min-w-[170px] text-center align-top transition-colors',
                    isPro && 'bg-primary/[0.04] relative',
                    isCurrent && !isExpired && 'bg-emerald-500/[0.02]',
                  )}
                >
                  {isPro && (
                    <div className="mb-2">
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 inline-flex items-center gap-1 shadow-xs">
                        <Sparkles className="size-2.5" />
                        <span>{t('plans.popular')}</span>
                      </Badge>
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-1">
                    <span className="font-bold text-sm text-foreground">{name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      {plan.code}
                    </span>

                    <div className="my-1 flex flex-col items-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span
                          data-testid={`comparison-price-${plan.code.toLowerCase()}`}
                          className="text-xl font-extrabold text-foreground"
                        >
                          {displayMonthlyPrice === 0
                            ? isUk
                              ? '0 грн'
                              : 'Free'
                            : `${displayMonthlyPrice} ${currencySymbol}`}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {isUk ? '/міс' : '/mo'}
                        </span>
                      </div>

                      {isYearly && hasYearlyOption ? (
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {plan.priceYearly} {currencySymbol} {isUk ? '/рік' : '/yr'}
                        </span>
                      ) : null}
                    </div>

                    {/* Action Button for User */}
                    <div className="w-full max-w-[140px] mt-1">
                      {isInvitedMember ? (
                        <Button
                          variant="outline"
                          disabled
                          className="h-7 px-2 text-[11px] w-full cursor-not-allowed opacity-70"
                        >
                          {isUk ? 'Керується власником' : 'Managed by Owner'}
                        </Button>
                      ) : isCurrent && !isExpired ? (
                        <Button
                          variant="outline"
                          disabled
                          data-testid={`comparison-select-btn-${plan.code.toLowerCase()}`}
                          className="h-7 px-2 text-[11px] w-full border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-semibold cursor-default"
                        >
                          <Check className="size-3 mr-1" />
                          <span>{t('plans.currentPlan')}</span>
                        </Button>
                      ) : isCurrent && isExpired ? (
                        <Button
                          variant="default"
                          data-testid={`comparison-select-btn-${plan.code.toLowerCase()}`}
                          onClick={() => onSelect(plan.code, billingInterval)}
                          disabled={isLoading}
                          className="h-7 px-2 text-[11px] w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1"
                        >
                          {isLoading ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <AlertTriangle className="size-3" />
                          )}
                          <span>{t('plans.renewPlan')}</span>
                        </Button>
                      ) : (
                        <Button
                          variant={isPro ? 'default' : 'outline'}
                          data-testid={`comparison-select-btn-${plan.code.toLowerCase()}`}
                          onClick={() => onSelect(plan.code, billingInterval)}
                          disabled={isLoading}
                          className={cn(
                            'h-7 px-2 text-[11px] w-full font-semibold gap-1',
                            isPro && 'bg-primary text-primary-foreground shadow-xs',
                          )}
                        >
                          {isLoading ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Zap className="size-3" />
                          )}
                          <span>
                            {plan.priceMonthly === 0
                              ? t('plans.selectPlan')
                              : isYearly
                                ? t('plans.selectYearlyPlan')
                                : t('plans.selectMonthlyPlan')}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Table Body Groups */}
        <tbody className="divide-y divide-border/60">
          {categories.map((cat, catIdx) => (
            <React.Fragment key={catIdx}>
              {/* Category Header Row */}
              <tr className="bg-secondary/30">
                <td
                  colSpan={sortedPlans.length + 1}
                  className="p-2.5 px-4 font-bold text-xs text-foreground tracking-wide uppercase bg-secondary/50 border-t border-b border-border/70"
                >
                  <div className="flex items-center gap-2">
                    <cat.icon className="size-3.5 text-primary shrink-0" />
                    <span>{isUk ? cat.titleUk : cat.titleEn}</span>
                  </div>
                </td>
              </tr>

              {/* Feature Rows */}
              {cat.rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-muted/30 transition-colors divide-x divide-border/50"
                >
                  {/* Feature Label */}
                  <td className="p-3 px-4 font-medium text-foreground/90 text-xs">
                    {isUk ? row.labelUk : row.labelEn}
                  </td>

                  {/* Plan Value Cells */}
                  {sortedPlans.map((plan) => {
                    const isPro = plan.code === 'PRO' || plan.isPopular;
                    const isCurrent = currentPlanCode === plan.code;

                    return (
                      <td
                        key={plan.id}
                        data-testid={`comparison-cell-${plan.code.toLowerCase()}-${rowIdx}`}
                        className={cn(
                          'p-3 text-center text-xs',
                          isPro && 'bg-primary/[0.02]',
                          isCurrent && !isExpired && 'bg-emerald-500/[0.01]',
                        )}
                      >
                        {row.getValue(plan, isUk)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
