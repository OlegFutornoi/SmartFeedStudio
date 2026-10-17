import type { SupplierDto } from '@smartfeed/shared';
import type { FeedAnalysisResult } from '@/lib/api';
import { ReverseMarginSimulator } from '@/modules/feed-simulator';

export interface WizardPricingSimulatorProps {
  supplier?: SupplierDto;
  analysis?: FeedAnalysisResult | null;
  sampleProducts?: Array<{
    sku: string;
    titleUk: string;
    costPrice: number;
    price: number;
    currency: string;
  }>;
  totalDetected?: number;
}

export function WizardPricingSimulator({ supplier, analysis }: WizardPricingSimulatorProps) {
  return <ReverseMarginSimulator supplier={supplier} analysis={analysis} />;
}
