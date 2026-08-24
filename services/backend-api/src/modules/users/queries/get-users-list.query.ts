export class GetUsersListQuery {
  constructor(
    public readonly search?: string,
    public readonly role?: string,
    public readonly limit = 50,
    public readonly offset = 0,
  ) {}
}
