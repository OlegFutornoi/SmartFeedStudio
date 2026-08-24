import { TargetApp } from '@smartfeed/shared';

export class GetAllNavigationItemsQuery {
  constructor(public readonly targetApp?: TargetApp) {}
}
