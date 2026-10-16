/**
 * Suppliers Query Handlers Facade
 * Each handler resides in its own single-responsibility file (<100 lines) per ARCH-04.
 */
export { GetSuppliersHandler } from '@/modules/suppliers/queries/get-suppliers.handler';
export { GetSupplierByIdHandler } from '@/modules/suppliers/queries/get-supplier-by-id.handler';
export { GetSupplierCategoriesHandler } from '@/modules/suppliers/queries/get-supplier-categories.handler';
export { GetSupplierPricingRulesHandler } from '@/modules/suppliers/queries/get-supplier-pricing-rules.handler';
