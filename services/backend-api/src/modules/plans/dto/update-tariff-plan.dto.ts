import { PartialType } from '@nestjs/swagger';
import { CreateTariffPlanDto } from '@/modules/plans/dto/create-tariff-plan.dto';

export class UpdateTariffPlanDto extends PartialType(CreateTariffPlanDto) {}
