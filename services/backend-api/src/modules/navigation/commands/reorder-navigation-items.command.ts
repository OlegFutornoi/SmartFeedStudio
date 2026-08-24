import { ReorderNavigationItemsDto } from '@smartfeed/shared';

export class ReorderNavigationItemsCommand {
  constructor(public readonly dto: ReorderNavigationItemsDto) {}
}
