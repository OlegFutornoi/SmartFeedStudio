import { FeatureCategory } from '@/components/plans/comparisonCellRenderers';
import { getInputOutputCategories } from '@/components/plans/comparisonCategoriesInputOutput';
import { getAdvancedCategories } from '@/components/plans/comparisonCategoriesAdvanced';

export * from '@/components/plans/comparisonCellRenderers';

export function buildComparisonCategories(isUk: boolean): FeatureCategory[] {
  return [...getInputOutputCategories(isUk), ...getAdvancedCategories(isUk)];
}
