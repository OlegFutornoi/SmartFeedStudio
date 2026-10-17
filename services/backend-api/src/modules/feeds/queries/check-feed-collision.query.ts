import { CheckFeedCollisionDto } from '@/modules/feeds/dto';

export class CheckFeedCollisionQuery {
  constructor(
    public readonly dto: CheckFeedCollisionDto,
    public readonly userId: string,
  ) {}
}
