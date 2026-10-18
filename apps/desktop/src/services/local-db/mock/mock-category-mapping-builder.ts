import {
  type MarketplaceCategoryDto,
  type SupplierCategoryRuleDto,
  suggestMarketplaceCategory,
} from '@smartfeed/shared';

export function buildDefaultCategoryMappings(
  categoryName: string,
  prevRule: SupplierCategoryRuleDto | undefined,
  catalog: MarketplaceCategoryDto[],
): {
  mappings: NonNullable<SupplierCategoryRuleDto['marketplaceMappings']>;
  activeMp: string;
  activeMap: NonNullable<SupplierCategoryRuleDto['marketplaceMappings']>[string] | undefined;
} {
  const suggestedRz = suggestMarketplaceCategory(categoryName, catalog, 'ROZETKA');
  const suggestedProm = suggestMarketplaceCategory(categoryName, catalog, 'PROM');

  const defaultMappings: NonNullable<SupplierCategoryRuleDto['marketplaceMappings']> = {};
  if (suggestedRz) {
    defaultMappings.ROZETKA = {
      marketplaceCode: 'ROZETKA',
      marketplaceCategoryId: suggestedRz.id,
      externalCategoryId: suggestedRz.externalId,
      externalCategoryName: suggestedRz.nameUk,
      commissionPercent: suggestedRz.defaultCommissionPercent,
      fixedFee: suggestedRz.defaultFixedFee,
    };
  }
  if (suggestedProm) {
    defaultMappings.PROM = {
      marketplaceCode: 'PROM',
      marketplaceCategoryId: suggestedProm.id,
      externalCategoryId: suggestedProm.externalId,
      externalCategoryName: suggestedProm.nameUk,
      commissionPercent: suggestedProm.defaultCommissionPercent,
      fixedFee: suggestedProm.defaultFixedFee,
    };
  }

  const mappings = prevRule?.marketplaceMappings || defaultMappings;
  const activeMp = prevRule?.marketplaceCode || 'ROZETKA';
  return { mappings, activeMp, activeMap: mappings[activeMp] };
}
