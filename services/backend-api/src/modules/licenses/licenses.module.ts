import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserCreatedEventHandler } from './events/user-created.event-handler';
import { CreateLicenseHandler } from './commands/create-license.handler';
import { SelectTariffPlanHandler } from './commands/select-tariff-plan.handler';
import { UpdateLicenseStatusHandler } from './commands/update-license-status.handler';
import { DeleteLicenseHandler } from './commands/delete-license.handler';
import { GetLicenseByUserIdHandler } from './queries/get-license-by-user-id.handler';
import { GetAdminLicensesHandler } from './queries/get-admin-licenses.handler';
import { LicensesController } from './licenses.controller';
import { AuthModule } from '../auth/auth.module';

import { RequireActiveLicenseGuard } from './guards/require-active-license.guard';

export const CommandHandlers = [
  CreateLicenseHandler,
  SelectTariffPlanHandler,
  UpdateLicenseStatusHandler,
  DeleteLicenseHandler,
];

export const QueryHandlers = [GetLicenseByUserIdHandler, GetAdminLicensesHandler];
export const EventHandlers = [UserCreatedEventHandler];

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [LicensesController],
  providers: [...CommandHandlers, ...QueryHandlers, ...EventHandlers, RequireActiveLicenseGuard],
  exports: [...CommandHandlers, ...QueryHandlers, ...EventHandlers, RequireActiveLicenseGuard],
})
export class LicensesModule {}
