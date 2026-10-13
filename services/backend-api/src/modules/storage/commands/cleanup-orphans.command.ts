import { CleanupOrphansDto } from '@/modules/storage/dto/cleanup-orphans.dto';

export class CleanupOrphansCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: CleanupOrphansDto,
  ) {}
}
