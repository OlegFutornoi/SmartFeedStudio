import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { TariffPlanDto } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetTariffPlansQuery } from './get-tariff-plans.query';
import { mapTariffPlanToDto } from '../utils/map-tariff-plan-to-dto';

@Injectable()
@QueryHandler(GetTariffPlansQuery)
export class GetTariffPlansHandler implements IQueryHandler<GetTariffPlansQuery, TariffPlanDto[]> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<TariffPlanDto[]> {
    const plans = await this.prisma.tariffPlan.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return plans.map(mapTariffPlanToDto);
  }
}
