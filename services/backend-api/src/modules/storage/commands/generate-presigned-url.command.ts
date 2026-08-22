import { ICommand } from '@nestjs/cqrs';

export class GeneratePresignedUploadUrlCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly fileName: string,
    public readonly contentType: string,
    public readonly folder: string = 'images',
  ) {}
}
