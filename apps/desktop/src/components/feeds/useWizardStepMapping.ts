import { useMemo } from 'react';
import type { FeedAnalysisResult } from '@/lib/api';

interface UseWizardStepMappingProps {
  analysis: FeedAnalysisResult | null;
  selectedCategoryIds: string[];
  productQuota?: {
    used: number;
    max: number;
    isUnlimited: boolean;
  };
}

export function useWizardStepMapping({
  analysis,
  selectedCategoryIds,
  productQuota,
}: UseWizardStepMappingProps) {
  const isUnlimited = productQuota?.isUnlimited ?? false;
  const remainingQuota = productQuota ? Math.max(0, productQuota.max - productQuota.used) : 10000;

  const totalSelectedSkus = useMemo(() => {
    if (!analysis) return 0;
    const cats = analysis.categories || [];
    if (cats.length === 0) return analysis.totalDetected;
    if (selectedCategoryIds.length === 0) return 0;
    const selectedSet = new Set(selectedCategoryIds);
    const sum = cats
      .filter((c) => selectedSet.has(c.id))
      .reduce((acc, c) => acc + (c.productCount || 0), 0);
    return sum > 0 ? sum : analysis.totalDetected;
  }, [analysis, selectedCategoryIds]);

  const isQuotaExceeded = !isUnlimited && totalSelectedSkus > remainingQuota;

  return {
    totalSelectedSkus,
    isQuotaExceeded,
    isUnlimited,
    remainingQuota,
  };
}
