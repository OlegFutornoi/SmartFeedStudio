'use client';

import React, { useMemo } from 'react';
import { TariffPlanDto } from '@smartfeed/shared';
import { buildComparisonCategories } from '@/components/plans/comparisonTableConfig';
import { ComparisonTableHeader } from '@/components/plans/ComparisonTableHeader';
import { ComparisonCategoryGroup } from '@/components/plans/ComparisonCategoryGroup';

interface PlanComparisonTableProps {
  plans: TariffPlanDto[];
  isUk: boolean;
  onEdit: (plan: TariffPlanDto) => void;
}

export function PlanComparisonTable({ plans, isUk, onEdit }: PlanComparisonTableProps) {
  const sortedPlans = useMemo(() => [...plans].sort((a, b) => a.order - b.order), [plans]);
  const categories = useMemo(() => buildComparisonCategories(isUk), [isUk]);

  return (
    <div
      data-testid="plans-comparison-table-container"
      className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-sm"
    >
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <ComparisonTableHeader sortedPlans={sortedPlans} isUk={isUk} onEdit={onEdit} />
        </thead>

        <tbody className="divide-y divide-border/60">
          {categories.map((cat, catIdx) => (
            <React.Fragment key={catIdx}>
              <ComparisonCategoryGroup category={cat} sortedPlans={sortedPlans} isUk={isUk} />
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
