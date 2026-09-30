import React from 'react';
import { Sparkles, Pencil } from 'lucide-react';
import { TariffPlanDto } from '@smartfeed/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ComparisonTableHeaderProps {
  sortedPlans: TariffPlanDto[];
  isUk: boolean;
  onEdit: (plan: TariffPlanDto) => void;
}

export function ComparisonTableHeader({ sortedPlans, isUk, onEdit }: ComparisonTableHeaderProps) {
  return (
    <tr className="border-b border-border bg-muted/40 divide-x divide-border/60">
      <th className="p-4 w-[28%] min-w-[220px] font-semibold text-foreground align-bottom">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold">{isUk ? 'Можливості тарифу' : 'Plan Features'}</span>
          <span className="text-[11px] text-muted-foreground font-normal">
            {isUk
              ? 'Порівняйте параметри та оберіть оптимальний план'
              : 'Compare quotas and pick the best tier'}
          </span>
        </div>
      </th>

      {sortedPlans.map((plan) => {
        const name = isUk ? plan.nameUk : plan.nameEn;
        const currencySymbol = plan.currency === 'UAH' ? 'грн' : '$';
        const isPro = plan.code === 'PRO' || plan.isPopular;

        return (
          <th
            key={plan.id}
            data-testid={`comparison-header-${plan.code.toLowerCase()}`}
            className={`p-4 min-w-[170px] text-center align-top transition-colors ${
              isPro ? 'bg-primary/[0.04] relative' : ''
            }`}
          >
            {isPro && (
              <div className="mb-2">
                <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 inline-flex items-center gap-1 shadow-xs">
                  <Sparkles className="size-2.5" />
                  <span>{isUk ? 'Хіт продажу' : 'Popular'}</span>
                </Badge>
              </div>
            )}

            <div className="flex flex-col items-center gap-1">
              <span className="font-bold text-sm text-foreground">{name}</span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                {plan.code}
              </span>

              <div className="my-1.5 flex items-baseline justify-center gap-1">
                <span className="text-xl font-extrabold text-foreground">
                  {plan.priceMonthly === 0
                    ? isUk
                      ? '0 грн'
                      : 'Free'
                    : `${plan.priceMonthly} ${currencySymbol}`}
                </span>
                <span className="text-[11px] text-muted-foreground">{isUk ? '/міс' : '/mo'}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                data-testid={`comparison-edit-btn-${plan.code.toLowerCase()}`}
                onClick={() => onEdit(plan)}
                className="h-7 px-2.5 text-[11px] gap-1 mt-1 w-full max-w-[130px]"
              >
                <Pencil className="size-2.5 text-muted-foreground" />
                <span>{isUk ? 'Редагувати' : 'Edit'}</span>
              </Button>
            </div>
          </th>
        );
      })}
    </tr>
  );
}
