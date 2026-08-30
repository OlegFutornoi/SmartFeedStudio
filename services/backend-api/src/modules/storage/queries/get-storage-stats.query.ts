export class GetStorageStatsQuery {
  constructor(
    public readonly userId: string,
    public readonly workspacePath?: string,
  ) {}
}
