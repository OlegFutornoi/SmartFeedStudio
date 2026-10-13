import type { SupplierCategoryRuleDto } from '@smartfeed/shared';

export function getInitialSeededCategories(
  defaultSupplierId: string,
  techSupplierId: string,
): Map<string, SupplierCategoryRuleDto[]> {
  const map = new Map<string, SupplierCategoryRuleDto[]>();
  const now = new Date().toISOString();

  map.set(defaultSupplierId, [
    {
      id: `scat_${defaultSupplierId}_01`,
      supplierId: defaultSupplierId,
      feedCategoryId: 'cat_01',
      name: 'Ноутбуки та ультрабуки',
      parentId: null,
      isActive: true,
      marginPercent: 12,
      fixedMarkup: 200,
      productCount: 85,
      updatedAt: now,
    },
    {
      id: `scat_${defaultSupplierId}_02`,
      supplierId: defaultSupplierId,
      feedCategoryId: 'cat_02',
      name: 'Смартфони та телефони',
      parentId: null,
      isActive: true,
      marginPercent: 10,
      fixedMarkup: 150,
      productCount: 140,
      updatedAt: now,
    },
    {
      id: `scat_${defaultSupplierId}_03`,
      supplierId: defaultSupplierId,
      feedCategoryId: 'cat_03',
      name: 'Планшети та рідери',
      parentId: null,
      isActive: true,
      marginPercent: 15,
      fixedMarkup: 100,
      productCount: 65,
      updatedAt: now,
    },
    {
      id: `scat_${defaultSupplierId}_04`,
      supplierId: defaultSupplierId,
      feedCategoryId: 'cat_04',
      name: 'Аксесуари та комплектуючі',
      parentId: null,
      isActive: true,
      marginPercent: 35,
      fixedMarkup: 50,
      productCount: 160,
      updatedAt: now,
    },
  ]);

  map.set(techSupplierId, [
    {
      id: `scat_${techSupplierId}_01`,
      supplierId: techSupplierId,
      feedCategoryId: 'cat_tech_01',
      name: 'Електроніка та гаджети',
      parentId: null,
      isActive: true,
      marginPercent: 20,
      fixedMarkup: 100,
      productCount: 90,
      updatedAt: now,
    },
    {
      id: `scat_${techSupplierId}_02`,
      supplierId: techSupplierId,
      feedCategoryId: 'cat_tech_02',
      name: 'Аксесуари та комплектуючі',
      parentId: null,
      isActive: true,
      marginPercent: 25,
      fixedMarkup: 50,
      productCount: 60,
      updatedAt: now,
    },
    {
      id: `scat_${techSupplierId}_03`,
      supplierId: techSupplierId,
      feedCategoryId: 'cat_tech_03',
      name: 'Смартфони та телефони',
      parentId: null,
      isActive: false,
      marginPercent: 15,
      fixedMarkup: 80,
      productCount: 30,
      updatedAt: now,
    },
  ]);

  return map;
}
