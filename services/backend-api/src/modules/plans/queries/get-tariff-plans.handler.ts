import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { TariffPlanDto } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisCacheService } from '../../../common/cache/redis-cache.service';
import { GetTariffPlansQuery } from './get-tariff-plans.query';
import { mapTariffPlanToDto } from '../utils/map-tariff-plan-to-dto';

const PLANS_CACHE_KEY = 'tariff_plans:active';

@Injectable()
@QueryHandler(GetTariffPlansQuery)
export class GetTariffPlansHandler implements IQueryHandler<GetTariffPlansQuery, TariffPlanDto[]> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  async execute(): Promise<TariffPlanDto[]> {
    const cached = await this.cache.get<TariffPlanDto[]>(PLANS_CACHE_KEY);
    if (cached) {
      return cached;
    }

    const plans = await this.prisma.tariffPlan.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    const result = plans.map(mapTariffPlanToDto);
    await this.cache.set(PLANS_CACHE_KEY, result, 3600);
    return result;
  }
}
