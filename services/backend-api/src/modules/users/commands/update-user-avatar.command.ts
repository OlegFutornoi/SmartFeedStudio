export class UpdateUserAvatarCommand {
  constructor(
    public readonly userId: string,
    public readonly avatarUrl: string | null,
  ) {}
}
