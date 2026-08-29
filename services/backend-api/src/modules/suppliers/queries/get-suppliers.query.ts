export class GetSuppliersQuery {
  constructor(
    public readonly userId: string,
    public readonly search?: string,
    public readonly isActive?: boolean,
  ) {}
}
