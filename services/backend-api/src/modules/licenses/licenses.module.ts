import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserCreatedEventHandler } from './events/user-created.event-handler';
import { CreateLicenseHandler } from './commands/create-license.handler';
import { GetLicenseByUserIdHandler } from './queries/get-license-by-user-id.handler';
import { LicensesController } from './licenses.controller';

export const CommandHandlers = [CreateLicenseHandler];
export const QueryHandlers = [GetLicenseByUserIdHandler];
export const EventHandlers = [UserCreatedEventHandler];

@Module({
  imports: [CqrsModule],
  controllers: [LicensesController],
  providers: [...CommandHandlers, ...QueryHandlers, ...EventHandlers],
  exports: [...CommandHandlers, ...QueryHandlers, ...EventHandlers],
})
export class LicensesModule {}
