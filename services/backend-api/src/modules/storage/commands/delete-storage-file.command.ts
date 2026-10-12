export class DeleteStorageFileCommand {
  constructor(
    public readonly userId: string,
    public readonly fileId: string,
  ) {}
}
