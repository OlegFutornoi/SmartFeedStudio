import { StorageFileListQueryDto } from '@/modules/storage/dto';

export class GetStorageFilesQuery {
  constructor(
    public readonly userId: string,
    public readonly queryDto: StorageFileListQueryDto,
  ) {}
}
