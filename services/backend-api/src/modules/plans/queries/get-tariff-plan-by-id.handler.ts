import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TariffPlanDto } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetTariffPlanByIdQuery } from './get-tariff-plan-by-id.query';

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

    return {
      id: plan.id,
      code: plan.code,
      nameUk: plan.nameUk,
      nameEn: plan.nameEn,
      descriptionUk: plan.descriptionUk,
      descriptionEn: plan.descriptionEn,
      priceMonthly: Number(plan.priceMonthly),
      priceYearly: plan.priceYearly ? Number(plan.priceYearly) : null,
      currency: plan.currency,
      maxXmlLimit: plan.maxXmlLimit,
      aiCredits: plan.aiCredits,
      canCloudBackup: plan.canCloudBackup,
      isPopular: plan.isPopular,
      isActive: plan.isActive,
      order: plan.order,
      featuresUk: plan.featuresUk,
      featuresEn: plan.featuresEn,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}
