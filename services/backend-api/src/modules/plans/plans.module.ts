import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PlansController } from '@/modules/plans/plans.controller';
import { CreateTariffPlanHandler } from '@/modules/plans/commands/create-tariff-plan.handler';
import { UpdateTariffPlanHandler } from '@/modules/plans/commands/update-tariff-plan.handler';
import { DeleteTariffPlanHandler } from '@/modules/plans/commands/delete-tariff-plan.handler';
import { GetTariffPlansHandler } from '@/modules/plans/queries/get-tariff-plans.handler';
import { GetAllTariffPlansAdminHandler } from '@/modules/plans/queries/get-all-tariff-plans-admin.handler';
import { GetTariffPlanByIdHandler } from '@/modules/plans/queries/get-tariff-plan-by-id.handler';
import { AuthModule } from '@/modules/auth/auth.module';

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
