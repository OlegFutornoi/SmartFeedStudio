import React from 'react';
import { Check, Minus, LucideIcon } from 'lucide-react';
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
export function boolCell(condition: boolean, isUk: boolean): React.ReactNode {
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
export function quotaCheckCell(isUk: boolean): React.ReactNode {
  return (
    <span className="inline-flex items-center gap-1 text-primary">
      <Check className="size-4 shrink-0" />
      <span className="text-[11px] text-muted-foreground">
        {isUk ? '(в межах ліміту)' : '(within quota)'}
      </span>
    </span>
  );
}
