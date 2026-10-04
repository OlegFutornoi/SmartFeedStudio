/**
 * comparisonTableConfig.tsx — Backward-compatible facade.
 * Category implementations are in the ./categories/ sub-modules.
 */

// Re-export shared types so consumers don't need to change imports
export type { FeatureRow, FeatureCategory } from '@/components/plans/categories/shared';

import { buildInputQuotasCategory } from '@/components/plans/categories/inputQuotas';
import { buildOutputChannelsCategory } from '@/components/plans/categories/outputChannels';
import { buildResourcesCategory } from '@/components/plans/categories/resources';
import { buildEnterpriseCategory } from '@/components/plans/categories/enterprise';
import type { FeatureCategory } from '@/components/plans/categories/shared';

export function buildComparisonCategories(isUk: boolean): FeatureCategory[] {
  return [
    buildInputQuotasCategory(isUk),
    buildOutputChannelsCategory(isUk),
    buildResourcesCategory(isUk),
    buildEnterpriseCategory(isUk),
  ];
}
