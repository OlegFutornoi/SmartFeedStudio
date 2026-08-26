import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TariffPlanDto } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetTariffPlanByIdQuery } from './get-tariff-plan-by-id.query';
import { mapTariffPlanToDto } from '../utils/map-tariff-plan-to-dto';

@Injectable()
@QueryHandler(GetTariffPlanByIdQuery)
export class GetTariffPlanByIdHandler implements IQueryHandler<
  GetTariffPlanByIdQuery,
  TariffPlanDto
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTariffPlanByIdQuery): Promise<TariffPlanDto> {
    const { id } = query;

    const plan = await this.prisma.tariffPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Tariff plan with ID "${id}" not found`);
    }

    return mapTariffPlanToDto(plan);
  }
}
