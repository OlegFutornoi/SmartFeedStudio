import { useMemo } from 'react';
import type { FeedAnalysisResult } from '@/lib/api';
import type { SupplierDto } from '@smartfeed/shared';
import { extractCategoryProductsFromAnalysis } from '@/modules/feed-simulator/services/reverse-margin.service';
import { ReverseMarginCinemaShowcase } from '@/modules/feed-simulator/components/ReverseMarginCinemaShowcase';

export interface ReverseMarginSimulatorProps {
  analysis?: FeedAnalysisResult | null;
  supplier?: SupplierDto;
}

export function ReverseMarginSimulator({ analysis }: ReverseMarginSimulatorProps) {
  const products = useMemo(() => extractCategoryProductsFromAnalysis(analysis), [analysis]);

  return (
    <div data-testid="wizard-pricing-simulator">
      <ReverseMarginCinemaShowcase products={products} />
    </div>
  );
}
