import { TargetApp } from '@smartfeed/shared';

export class GetBootstrapQuery {
  constructor(
    public readonly userId: string,
    public readonly targetApp: TargetApp = TargetApp.DESKTOP,
  ) {}
}
