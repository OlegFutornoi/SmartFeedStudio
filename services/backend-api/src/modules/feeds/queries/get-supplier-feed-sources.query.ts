export class GetSupplierFeedSourcesQuery {
  constructor(
    public readonly supplierId: string,
    public readonly userId: string,
  ) {}
}
