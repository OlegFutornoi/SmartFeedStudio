import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PlansController } from './plans.controller';
import { CreateTariffPlanHandler } from './commands/create-tariff-plan.handler';
import { UpdateTariffPlanHandler } from './commands/update-tariff-plan.handler';
import { DeleteTariffPlanHandler } from './commands/delete-tariff-plan.handler';
import { GetTariffPlansHandler } from './queries/get-tariff-plans.handler';
import { GetAllTariffPlansAdminHandler } from './queries/get-all-tariff-plans-admin.handler';
import { GetTariffPlanByIdHandler } from './queries/get-tariff-plan-by-id.handler';
import { AuthModule } from '../auth/auth.module';

const CommandHandlers = [CreateTariffPlanHandler, UpdateTariffPlanHandler, DeleteTariffPlanHandler];

const QueryHandlers = [
  GetTariffPlansHandler,
  GetAllTariffPlansAdminHandler,
  GetTariffPlanByIdHandler,
];

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [PlansController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [...CommandHandlers, ...QueryHandlers],
})
export class PlansModule {}
