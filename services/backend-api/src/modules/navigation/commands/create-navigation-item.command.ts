import { CreateNavigationItemDto } from '@smartfeed/shared';

export class CreateNavigationItemCommand {
  constructor(public readonly dto: CreateNavigationItemDto) {}
}
