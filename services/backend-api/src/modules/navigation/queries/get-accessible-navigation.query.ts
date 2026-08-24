import { Role, PlanType, TargetApp } from '@smartfeed/shared';

export class GetAccessibleNavigationQuery {
  constructor(
    public readonly userRole: Role,
    public readonly userPlan: PlanType | null,
    public readonly targetApp: TargetApp = TargetApp.DESKTOP,
  ) {}
}
