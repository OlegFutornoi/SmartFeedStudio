export class MigrateWorkspaceCommand {
  constructor(
    public readonly currentPath: string,
    public readonly newPath: string,
    public readonly moveExistingData: boolean = true,
  ) {}
}
