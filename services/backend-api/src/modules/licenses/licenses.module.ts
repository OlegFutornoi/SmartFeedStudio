import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserCreatedEventHandler } from './events/user-created.event-handler';
import { CreateLicenseHandler } from './commands/create-license.handler';
import { GetLicenseByUserIdHandler } from './queries/get-license-by-user-id.handler';
import { GetAdminLicensesHandler } from './queries/get-admin-licenses.handler';
import { LicensesController } from './licenses.controller';
import { AuthModule } from '../auth/auth.module';

export const CommandHandlers = [CreateLicenseHandler];
export const QueryHandlers = [GetLicenseByUserIdHandler, GetAdminLicensesHandler];
export const EventHandlers = [UserCreatedEventHandler];

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [LicensesController],
  providers: [...CommandHandlers, ...QueryHandlers, ...EventHandlers],
  exports: [...CommandHandlers, ...QueryHandlers, ...EventHandlers],
})
export class LicensesModule {}
