export class GetSuppliersQuery {
  constructor(
    public readonly userId: string,
    public readonly search?: string,
  ) {}
}

export class GetSupplierByIdQuery {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}

export class GetSupplierCategoriesQuery {
  constructor(
    public readonly supplierId: string,
    public readonly userId: string,
    public readonly search?: string,
  ) {}
}

export class GetSupplierPricingRulesQuery {
  constructor(
    public readonly supplierId: string,
    public readonly userId: string,
  ) {}
}
