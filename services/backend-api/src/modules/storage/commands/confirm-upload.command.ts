import { ConfirmUploadDto } from '@/modules/storage/dto/confirm-upload.dto';

export class ConfirmUploadCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: ConfirmUploadDto,
  ) {}
}
