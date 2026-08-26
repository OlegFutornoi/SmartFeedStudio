import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { TariffPlanDto } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetAllTariffPlansAdminQuery } from './get-all-tariff-plans-admin.query';
import { mapTariffPlanToDto } from '../utils/map-tariff-plan-to-dto';

@Injectable()
@QueryHandler(GetAllTariffPlansAdminQuery)
export class GetAllTariffPlansAdminHandler implements IQueryHandler<
  GetAllTariffPlansAdminQuery,
  TariffPlanDto[]
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<TariffPlanDto[]> {
    const plans = await this.prisma.tariffPlan.findMany({
      orderBy: { order: 'asc' },
    });

    return plans.map(mapTariffPlanToDto);
  }
}
