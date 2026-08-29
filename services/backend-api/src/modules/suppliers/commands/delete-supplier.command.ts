export class DeleteSupplierCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
