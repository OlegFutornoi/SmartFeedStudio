export class GetUsersListQuery {
  constructor(
    public readonly search?: string,
    public readonly role?: string,
    public readonly orgRoleFilter?: 'ALL' | 'OWNERS' | 'MEMBERS',
    public readonly limit = 50,
    public readonly offset = 0,
  ) {}
}
