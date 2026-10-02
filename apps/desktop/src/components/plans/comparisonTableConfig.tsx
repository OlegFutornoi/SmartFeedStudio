/**
 * comparisonTableConfig.tsx — Backward-compatible facade.
 * Category implementations are in the ./categories/ sub-modules.
 */

// Re-export shared types so consumers don't need to change imports
export type { FeatureRow, FeatureCategory } from './categories/shared';

import { buildInputQuotasCategory } from './categories/inputQuotas';
import { buildOutputChannelsCategory } from './categories/outputChannels';
import { buildResourcesCategory } from './categories/resources';
import { buildEnterpriseCategory } from './categories/enterprise';
import type { FeatureCategory } from './categories/shared';

export function buildComparisonCategories(isUk: boolean): FeatureCategory[] {
  return [
    buildInputQuotasCategory(isUk),
    buildOutputChannelsCategory(isUk),
    buildResourcesCategory(isUk),
    buildEnterpriseCategory(isUk),
  ];
}
