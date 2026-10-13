import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetPageGuidesQuery } from '@/modules/page-guides/queries/get-page-guides.query';
import { PageGuideDto, DEFAULT_PAGE_GUIDES, DEFAULT_AI_ASSISTANT_PROFILE } from '@smartfeed/shared';

@Injectable()
@QueryHandler(GetPageGuidesQuery)
export class GetPageGuidesHandler implements IQueryHandler<
  GetPageGuidesQuery,
  PageGuideDto[] | PageGuideDto | null
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPageGuidesQuery): Promise<PageGuideDto[] | PageGuideDto | null> {
    const { routeKey } = query;

    // Fetch active assistant profile from DB or default
    const assistantSetting = await this.prisma.aiAssistantSetting.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    const assistant = assistantSetting
      ? {
          name: assistantSetting.name,
          avatarUrl: assistantSetting.avatarUrl || undefined,
          roleUk: assistantSetting.roleUk,
          roleEn: assistantSetting.roleEn,
          badgeUk: assistantSetting.badgeUk,
          badgeEn: assistantSetting.badgeEn,
        }
      : DEFAULT_AI_ASSISTANT_PROFILE;

    // If specific route requested
    if (routeKey) {
      const normalizedRoute = routeKey.startsWith('/') ? routeKey : `/${routeKey}`;
      const dbGuide = await this.prisma.pageGuide.findUnique({
        where: { route: normalizedRoute },
      });

      if (dbGuide) {
        return {
          id: dbGuide.id,
          route: dbGuide.route,
          titleUk: dbGuide.titleUk,
          titleEn: dbGuide.titleEn,
          icon: dbGuide.icon,
          badgeUk: dbGuide.badgeUk,
          badgeEn: dbGuide.badgeEn,
          summaryUk: dbGuide.summaryUk,
          summaryEn: dbGuide.summaryEn,
          descriptionUk: dbGuide.descriptionUk,
          descriptionEn: dbGuide.descriptionEn,
          featuresUk: dbGuide.featuresUk,
          featuresEn: dbGuide.featuresEn,
          proTipUk: dbGuide.proTipUk || undefined,
          proTipEn: dbGuide.proTipEn || undefined,
          assistant,
        };
      }

      // Fallback from canonical default guides with route aliasing
      const defaultGuide =
        DEFAULT_PAGE_GUIDES[normalizedRoute] ||
        (normalizedRoute === '/ai-enrichment' ? DEFAULT_PAGE_GUIDES['/ai'] : undefined) ||
        (normalizedRoute === '/ai' ? DEFAULT_PAGE_GUIDES['/ai-enrichment'] : undefined) ||
        (normalizedRoute === '/channels' ? DEFAULT_PAGE_GUIDES['/catalogs'] : undefined) ||
        (normalizedRoute === '/quota' ? DEFAULT_PAGE_GUIDES['/plans'] : undefined);

      if (defaultGuide) {
        return {
          ...defaultGuide,
          assistant,
        };
      }

      return null;
    }

    // List all guides
    const dbGuides = await this.prisma.pageGuide.findMany({
      orderBy: { order: 'asc' },
    });

    if (dbGuides.length > 0) {
      return dbGuides.map((g) => ({
        id: g.id,
        route: g.route,
        titleUk: g.titleUk,
        titleEn: g.titleEn,
        icon: g.icon,
        badgeUk: g.badgeUk,
        badgeEn: g.badgeEn,
        summaryUk: g.summaryUk,
        summaryEn: g.summaryEn,
        descriptionUk: g.descriptionUk,
        descriptionEn: g.descriptionEn,
        featuresUk: g.featuresUk,
        featuresEn: g.featuresEn,
        proTipUk: g.proTipUk || undefined,
        proTipEn: g.proTipEn || undefined,
        assistant,
      }));
    }

    // Default seeded guides fallback
    return Object.values(DEFAULT_PAGE_GUIDES).map((g) => ({
      ...g,
      assistant,
    }));
  }
}
