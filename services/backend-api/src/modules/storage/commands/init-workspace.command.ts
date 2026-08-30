export class InitWorkspaceCommand {
  constructor(
    public readonly workspacePath: string,
    public readonly enableEncryption: boolean = true,
  ) {}
}
