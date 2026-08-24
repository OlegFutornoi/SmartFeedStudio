import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { TariffPlanDto } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetAllTariffPlansAdminQuery } from './get-all-tariff-plans-admin.query';

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

    return plans.map((plan) => ({
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
    }));
  }
}
