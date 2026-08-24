import { UpdateNavigationItemDto } from '@smartfeed/shared';

export class UpdateNavigationItemCommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateNavigationItemDto,
  ) {}
}
