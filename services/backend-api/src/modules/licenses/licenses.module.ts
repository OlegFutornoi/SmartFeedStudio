import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserCreatedEventHandler } from '@/modules/licenses/events/user-created.event-handler';
import { CreateLicenseHandler } from '@/modules/licenses/commands/create-license.handler';
import { SelectTariffPlanHandler } from '@/modules/licenses/commands/select-tariff-plan.handler';
import { UpdateLicenseStatusHandler } from '@/modules/licenses/commands/update-license-status.handler';
import { DeleteLicenseHandler } from '@/modules/licenses/commands/delete-license.handler';
import { GetLicenseByUserIdHandler } from '@/modules/licenses/queries/get-license-by-user-id.handler';
import { GetAdminLicensesHandler } from '@/modules/licenses/queries/get-admin-licenses.handler';
import { GetUsageQuotasHandler } from '@/modules/licenses/queries/get-usage-quotas.handler';
import { LicensesController } from '@/modules/licenses/licenses.controller';
import { AuthModule } from '@/modules/auth/auth.module';

import { RequireActiveLicenseGuard } from '@/modules/licenses/guards/require-active-license.guard';

export const CommandHandlers = [
  CreateLicenseHandler,
  SelectTariffPlanHandler,
  UpdateLicenseStatusHandler,
  DeleteLicenseHandler,
];

export const QueryHandlers = [
  GetLicenseByUserIdHandler,
  GetAdminLicensesHandler,
  GetUsageQuotasHandler,
];
export const EventHandlers = [UserCreatedEventHandler];

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [LicensesController],
  providers: [...CommandHandlers, ...QueryHandlers, ...EventHandlers, RequireActiveLicenseGuard],
  exports: [...CommandHandlers, ...QueryHandlers, ...EventHandlers, RequireActiveLicenseGuard],
})
export class LicensesModule {}
