export class DeleteSupplierFeedSourceCommand {
  constructor(
    public readonly supplierId: string,
    public readonly sourceId: string,
    public readonly userId: string,
  ) {}
}
