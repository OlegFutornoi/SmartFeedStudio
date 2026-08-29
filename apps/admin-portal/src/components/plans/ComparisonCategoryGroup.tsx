import React from 'react';
import { TariffPlanDto } from '@smartfeed/shared';
import { FeatureCategory } from './comparisonTableConfig';

interface ComparisonCategoryGroupProps {
  category: FeatureCategory;
  sortedPlans: TariffPlanDto[];
  isUk: boolean;
}

export function ComparisonCategoryGroup({
  category,
  sortedPlans,
  isUk,
}: ComparisonCategoryGroupProps) {
  return (
    <>
      <tr className="bg-secondary/30">
        <td
          colSpan={sortedPlans.length + 1}
          className="p-2.5 px-4 font-bold text-xs text-foreground tracking-wide uppercase bg-secondary/50 border-t border-b border-border/70"
        >
          <div className="flex items-center gap-2">
            <category.icon className="size-3.5 text-primary shrink-0" />
            <span>{isUk ? category.titleUk : category.titleEn}</span>
          </div>
        </td>
      </tr>

      {category.rows.map((row, rowIdx) => (
        <tr key={rowIdx} className="hover:bg-muted/30 transition-colors divide-x divide-border/50">
          <td className="p-3 px-4 font-medium text-foreground/90 text-xs">
            {isUk ? row.labelUk : row.labelEn}
          </td>

          {sortedPlans.map((plan) => {
            const isPro = plan.code === 'PRO' || plan.isPopular;

            return (
              <td
                key={plan.id}
                data-testid={`comparison-cell-${plan.code.toLowerCase()}-${rowIdx}`}
                className={`p-3 text-center text-xs ${isPro ? 'bg-primary/[0.02]' : ''}`}
              >
                {row.getValue(plan, isUk)}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
