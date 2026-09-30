'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { PlanType } from '@smartfeed/shared';
import { cn } from '@/lib/utils';

interface PlanSelectorProps {
  selected: PlanType;
  onChange: (plan: PlanType) => void;
}

const PLAN_OPTIONS: { value: PlanType; badge: string; color: string }[] = [
  { value: PlanType.STARTER, badge: 'Starter', color: 'bg-muted text-muted-foreground' },
  { value: PlanType.GROWTH, badge: 'Growth', color: 'bg-secondary text-secondary-foreground' },
  {
    value: PlanType.PRO,
    badge: 'Pro',
    color: 'bg-primary/10 text-primary border border-primary/20',
  },
  {
    value: PlanType.ENTERPRISE,
    badge: 'Enterprise',
    color: 'bg-primary text-primary-foreground font-semibold',
  },
];

export const PlanSelector = React.memo(function PlanSelector({
  selected,
  onChange,
}: PlanSelectorProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {PLAN_OPTIONS.map((p) => (
        <button
          key={p.value}
          type="button"
          data-testid={`plan-option-${p.value.toLowerCase()}`}
          onClick={() => onChange(p.value)}
          className={cn(
            'flex items-center h-7 px-3 rounded-md border text-xs font-medium transition-all',
            selected === p.value
              ? 'border-primary bg-primary/8 text-primary shadow-sm'
              : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border',
          )}
        >
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] px-1.5 py-0 h-4 border-0 font-semibold mr-1.5',
              selected === p.value ? 'bg-primary/15 text-primary' : p.color,
            )}
          >
            {p.badge}
          </Badge>
        </button>
      ))}
    </div>
  );
});
