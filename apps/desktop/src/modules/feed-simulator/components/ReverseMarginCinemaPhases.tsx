import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, Package, TrendingUp, Sparkles } from 'lucide-react';
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
  const phases = [
    {
      idx: 0,
      title: '1. Закупка постачальника',
      shortTitle: 'Закупка',
      icon: Package,
      value: `${scenario.costPrice} ₴`,
      subtitle: 'Базова собівартість',
      badge: 'Прайс постачальника',
      badgeClass: 'bg-muted text-foreground border-border',
      activeGradient:
        'bg-gradient-to-br from-secondary/80 via-secondary/40 to-card border-foreground/30 ring-2 ring-foreground/20 shadow-xs',
      idleGradient: 'bg-card/90 border-border/70 hover:border-foreground/20',
      textColor: 'text-foreground',
      accentColor: 'text-foreground',
      desc: 'Вхідна вартість одиниці товару за каталогом постачальника, яку необхідно оплатити за відвантаження.',
      mathTag: `Собівартість: ${scenario.costPrice} ₴`,
    },
    {
      idx: 1,
      title: '2. Моя націнка та Моя ціна',
      shortTitle: 'Моя ціна',
      icon: TrendingUp,
      value: `${scenario.myPrice} ₴`,
      subtitle: `Націнка +${scenario.markupPercent}% (+${scenario.desiredProfit} ₴)`,
      badge: `+${scenario.desiredProfit} ₴ прибутку`,
      badgeClass: 'bg-primary/15 text-primary border-primary/30',
      activeGradient:
        'bg-gradient-to-br from-primary/20 via-primary/5 to-card border-primary/60 ring-2 ring-primary/40 shadow-xs',
      idleGradient: 'bg-card/90 border-border/70 hover:border-primary/30',
      textColor: 'text-primary',
      accentColor: 'text-primary',
      desc: `Закупка ${scenario.costPrice} ₴ + бажаний заробіток ${scenario.desiredProfit} ₴ = ${scenario.myPrice} ₴ (скільки ви плануєте отримати на руки).`,
      mathTag: `${scenario.costPrice} ₴ + ${scenario.desiredProfit} ₴ = ${scenario.myPrice} ₴`,
    },
    {
      idx: 2,
      title: '3. Пастка комісії маркетплейсу',
      shortTitle: 'Пастка комісії',
      icon: AlertTriangle,
      value: `+${scenario.naiveActualProfit} ₴`,
      subtitle: `Втрата: -${scenario.profitLostToFee} ₴ (-${scenario.profitLostPercent}%)`,
      badge: `-${scenario.naiveMarketplaceFee} ₴ комісія`,
      badgeClass: 'bg-destructive/15 text-destructive border-destructive/30 animate-pulse',
      activeGradient:
        'bg-gradient-to-br from-destructive/20 via-destructive/5 to-card border-destructive/60 ring-2 ring-destructive/40 shadow-xs',
      idleGradient: 'bg-card/90 border-border/70 hover:border-destructive/30',
      textColor: 'text-destructive',
      accentColor: 'text-destructive',
      desc: `При наївній ціні ${scenario.naivePrice} ₴ комісія ${scenario.marketplacePercent}% утримується від повної суми продажу, з'їдаючи більшу частину прибутку!`,
      mathTag: `${scenario.naivePrice} ₴ - ${scenario.naiveMarketplaceFee} ₴ - ${scenario.costPrice} ₴ = +${scenario.naiveActualProfit} ₴`,
    },
    {
      idx: 3,
      title: '4. SmartFeed Ціна із захистом',
      shortTitle: 'SmartFeed Ціна',
      icon: ShieldCheck,
      value: `${scenario.smartRetailPrice} ₴`,
      subtitle: `Чистий прибуток рівно +${scenario.guaranteedProfit} ₴`,
      badge: '100% Захищено',
      badgeClass: 'bg-success/20 text-success border-success/40 font-semibold',
      activeGradient:
        'bg-gradient-to-br from-success/25 via-primary/10 to-card border-success/60 ring-2 ring-success/40 shadow-xs',
      idleGradient: 'bg-card/90 border-border/70 hover:border-success/30',
      textColor: 'text-success',
      accentColor: 'text-success',
      desc: `Формула зворотного %: вітринна ціна покриває комісію ${scenario.smartMarketplaceFee} ₴, зберігаючи вам копійка в копійку +${scenario.guaranteedProfit} ₴!`,
      mathTag: `(${scenario.myPrice} ₴) ÷ (1 - ${scenario.marketplacePercent}%) = ${scenario.smartRetailPrice} ₴`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {phases.map((item) => {
        const Icon = item.icon;
        const isCurrentActive = phaseIndex === item.idx;
        const isRevealed = phaseIndex >= item.idx;

        return (
          <div
            key={item.idx}
            onClick={() => onSelectPhase?.(item.idx)}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              isCurrentActive
                ? `${item.activeGradient} scale-[1.02] shadow-md z-10`
                : isRevealed
                  ? `${item.idleGradient} opacity-95`
                  : 'bg-card/60 border-border/40 opacity-50'
            }`}
          >
            {/* Top Indicator bar */}
            {isCurrentActive && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-80" />
            )}

            <div className="space-y-2">
              {/* Header: Title and Badge */}
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <span
                  className={`flex items-center gap-1.5 text-xs font-semibold ${item.textColor}`}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span>{item.title}</span>
                </span>
                <Badge
                  variant="outline"
                  className={`text-3xs px-1.5 py-0 font-mono ${item.badgeClass}`}
                >
                  {item.badge}
                </Badge>
              </div>

              {/* Main Prominent Price/Amount Value */}
              <div>
                <div
                  className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${item.accentColor}`}
                >
                  {item.value}
                </div>
                <div className="text-2xs font-medium text-muted-foreground mt-0.5">
                  {item.subtitle}
                </div>
              </div>
            </div>

            {/* Bottom: Explanation & Math Formula Tag */}
            <div className="mt-3 pt-2.5 border-t border-border/50 space-y-1.5">
              <div className="p-1 px-2 rounded-lg bg-background/80 border border-border/60 text-3xs font-mono text-muted-foreground flex items-center gap-1 truncate">
                <Sparkles className="size-2.5 text-primary shrink-0" />
                <span className="truncate">{item.mathTag}</span>
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
