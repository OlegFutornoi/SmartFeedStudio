export class GetProductByIdQuery {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
