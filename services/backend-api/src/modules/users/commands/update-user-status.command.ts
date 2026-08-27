export class UpdateUserStatusCommand {
  constructor(
    public readonly userId: string,
    public readonly isActive: boolean,
    public readonly requesterId?: string,
  ) {}
}
