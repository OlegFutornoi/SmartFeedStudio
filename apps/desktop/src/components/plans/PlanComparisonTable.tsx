'use client';

import React, { useMemo } from 'react';
import type { TariffPlanDto, BillingInterval } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';
import { buildComparisonCategories } from './comparisonTableConfig';
import { ComparisonTableHeader } from './ComparisonTableHeader';
import { ComparisonCategoryGroup } from './ComparisonCategoryGroup';

interface PlanComparisonTableProps {
  plans: TariffPlanDto[];
  currentPlanCode?: string | null;
  billingInterval?: BillingInterval;
  isExpired?: boolean;
  isLoadingPlanCode?: string | null;
  isInvitedMember?: boolean;
  onSelect: (planCode: string, billingInterval?: BillingInterval) => void;
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

  const sortedPlans = useMemo(() => [...plans].sort((a, b) => a.order - b.order), [plans]);
  const categories = useMemo(() => buildComparisonCategories(isUk), [isUk]);

  return (
    <div
      data-testid="plans-comparison-table-container"
      className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-sm"
    >
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <ComparisonTableHeader
            sortedPlans={sortedPlans}
            currentPlanCode={currentPlanCode}
            billingInterval={billingInterval}
            isExpired={isExpired}
            isLoadingPlanCode={isLoadingPlanCode}
            isInvitedMember={isInvitedMember}
            isUk={isUk}
            isYearly={isYearly}
            t={t}
            onSelect={onSelect}
          />
        </thead>

        <tbody className="divide-y divide-border/60">
          {categories.map((cat, catIdx) => (
            <React.Fragment key={catIdx}>
              <ComparisonCategoryGroup
                category={cat}
                sortedPlans={sortedPlans}
                currentPlanCode={currentPlanCode}
                isExpired={isExpired}
                isUk={isUk}
              />
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
