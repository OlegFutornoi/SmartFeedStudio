export class GetSupplierByIdQuery {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
