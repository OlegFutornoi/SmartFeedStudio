import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, Package, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { CinemaScenario } from '@/modules/feed-simulator/services/reverse-margin-cinema.service';

interface ReverseMarginCinemaPhasesProps {
  scenario: CinemaScenario;
  phaseIndex: number;
  onSelectPhase?: (phase: number) => void;
}

export function ReverseMarginCinemaPhases({
  scenario,
  phaseIndex,
  onSelectPhase,
}: ReverseMarginCinemaPhasesProps) {
  const { t } = useTranslation(['suppliers']);

  const phases = [
    {
      idx: 0,
      title: t('suppliers:cinemaPhase1Title', { defaultValue: '1. Закупка постачальника' }),
      icon: Package,
      value: `${scenario.costPrice} ₴`,
      subtitle: t('suppliers:cinemaPhase1Subtitle', { defaultValue: 'Базова ціна у XML-фіді' }),
      badge: t('suppliers:cinemaPhase1Badge', { defaultValue: 'Вхідна ціна' }),
      badgeClass: 'bg-muted/60 text-muted-foreground border-border/60',
      activeBorder: 'border-foreground/50 bg-muted/20',
      activeIndicator: 'bg-foreground/70',
      iconColor: 'text-muted-foreground',
      accentColor: 'text-foreground',
      desc: t('suppliers:cinemaPhase1Desc', {
        defaultValue: 'Оптова ціна товару у прайсі постачальника',
      }),
      mathTag: `${scenario.costPrice} ₴`,
    },
    {
      idx: 1,
      title: t('suppliers:cinemaPhase2Title', { defaultValue: '2. Моя націнка та Моя ціна' }),
      icon: TrendingUp,
      value: `${scenario.myPrice} ₴`,
      subtitle: t('suppliers:cinemaPhase2Subtitle', {
        percent: scenario.markupPercent,
        profit: scenario.desiredProfit,
        defaultValue: 'Собівартість + {{percent}}% (мої +{{profit}} ₴)',
      }),
      badge: t('suppliers:cinemaPhase2Badge', {
        profit: scenario.desiredProfit,
        defaultValue: 'Очікуваний дохід +{{profit}} ₴',
      }),
      badgeClass: 'bg-muted/60 text-foreground border-border/60',
      activeBorder: 'border-foreground/50 bg-muted/20',
      activeIndicator: 'bg-foreground',
      iconColor: 'text-muted-foreground',
      accentColor: 'text-foreground',
      desc: t('suppliers:cinemaPhase2Desc', {
        defaultValue: 'Ціна, яку продавці помилково виставляють напряму на маркетплейс',
      }),
      mathTag: `${scenario.costPrice} ₴ + ${scenario.desiredProfit} ₴ = ${scenario.myPrice} ₴`,
    },
    {
      idx: 2,
      title: t('suppliers:cinemaPhase3Title', { defaultValue: '3. Пастка комісії маркетплейсу' }),
      icon: AlertTriangle,
      value: `+${scenario.naiveActualProfit} ₴`,
      subtitle: t('suppliers:cinemaPhase3Subtitle', {
        marketplace: scenario.marketplaceName,
        percent: scenario.marketplacePercent,
        fee: scenario.naiveMarketplaceFee,
        defaultValue: '{{marketplace}} забирає {{percent}}% (-{{fee}} ₴)',
      }),
      badge: t('suppliers:cinemaPhase3Badge', {
        loss: scenario.profitLostToFee,
        defaultValue: 'Втрата -{{loss}} ₴ маржі',
      }),
      badgeClass: 'bg-destructive/10 text-destructive border-destructive/25',
      activeBorder: 'border-destructive/60 bg-destructive/5',
      activeIndicator: 'bg-destructive',
      iconColor: 'text-destructive',
      accentColor: 'text-destructive',
      desc: t('suppliers:cinemaPhase3Desc', {
        desired: scenario.desiredProfit,
        actual: scenario.naiveActualProfit,
        defaultValue:
          "Замість +{{desired}} ₴ заробляєте лише {{actual}} ₴! Комісія з'їла ваш прибуток",
      }),
      mathTag: `${scenario.naivePrice} ₴ - ${scenario.naiveMarketplaceFee} ₴ - ${scenario.costPrice} ₴ = +${scenario.naiveActualProfit} ₴`,
    },
    {
      idx: 3,
      title: t('suppliers:cinemaPhase4Title', { defaultValue: '4. SmartFeed Ціна із захистом' }),
      icon: ShieldCheck,
      value: `${scenario.smartRetailPrice} ₴`,
      subtitle: t('suppliers:cinemaPhase4Subtitle', {
        price: scenario.myPrice,
        percent: scenario.marketplacePercent,
        defaultValue: 'Формула: {{price}} ÷ (1 - 0.{{percent}})',
      }),
      badge: t('suppliers:cinemaPhase4Badge', {
        profit: scenario.guaranteedProfit,
        defaultValue: 'Чистими рівно +{{profit}} ₴',
      }),
      badgeClass: 'bg-success/15 text-success border-success/30 font-semibold',
      activeBorder: 'border-success/60 bg-success/5',
      activeIndicator: 'bg-success',
      iconColor: 'text-success',
      accentColor: 'text-success',
      desc: t('suppliers:cinemaPhase4Desc', {
        fee: scenario.smartMarketplaceFee,
        profit: scenario.guaranteedProfit,
        defaultValue:
          'Комісія {{fee}} ₴ повністю закладена в ціну. Ваш прибуток +{{profit}} ₴ захищено!',
      }),
      mathTag: `(${scenario.myPrice} ₴) ÷ (1 - ${scenario.marketplacePercent}%) = ${scenario.smartRetailPrice} ₴`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
      {phases.map((item) => {
        const Icon = item.icon;
        const isCurrentActive = phaseIndex === item.idx;

        return (
          <div
            key={item.idx}
            role="button"
            tabIndex={0}
            onClick={() => onSelectPhase?.(item.idx)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectPhase?.(item.idx);
              }
            }}
            className={`p-3 rounded-md border text-left transition-colors duration-150 cursor-pointer relative overflow-hidden flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isCurrentActive
                ? item.activeBorder
                : 'border-border/60 bg-background/50 hover:bg-muted/20 hover:border-border'
            }`}
          >
            {isCurrentActive && (
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${item.activeIndicator}`} />
            )}

            <div className="space-y-1.5 w-full">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <span className="flex items-center gap-1.5 text-2xs font-semibold text-foreground">
                  <Icon className={`size-3.5 shrink-0 ${item.iconColor}`} />
                  <span className="truncate">{item.title}</span>
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2 pt-0.5">
                <div
                  className={`text-lg font-bold font-mono tabular-nums tracking-tight ${item.accentColor}`}
                >
                  {item.value}
                </div>
                <Badge
                  variant="outline"
                  className={`text-3xs px-1.5 py-0 h-4 font-mono tabular-nums shrink-0 ${item.badgeClass}`}
                >
                  {item.badge}
                </Badge>
              </div>

              <div className="text-3xs font-medium text-muted-foreground truncate">
                {item.subtitle}
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-border/50 space-y-1 w-full">
              <div className="px-2 py-0.5 rounded-sm bg-muted/40 border border-border/50 text-3xs font-mono tabular-nums text-muted-foreground truncate">
                {item.mathTag}
              </div>
              <p className="text-3xs text-muted-foreground leading-snug line-clamp-2">
                {item.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
