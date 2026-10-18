import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  FeedCollisionResultDto,
  FeedCollisionType,
  normalizeFeedUrl,
  computeFeedContentHash,
  generateDisambiguatedFeedName,
} from '@smartfeed/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { CheckFeedCollisionQuery } from '@/modules/feeds/queries/check-feed-collision.query';

@Injectable()
@QueryHandler(CheckFeedCollisionQuery)
export class CheckFeedCollisionHandler implements IQueryHandler<
  CheckFeedCollisionQuery,
  FeedCollisionResultDto
> {
  private readonly logger = new Logger(CheckFeedCollisionHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(query: CheckFeedCollisionQuery): Promise<FeedCollisionResultDto> {
    const { dto, userId } = query;
    const candidateName = dto.feedName?.trim() || dto.fileName?.trim() || 'Фід товарів';

    // 1. Verify supplier ownership and existence
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id: dto.supplierId,
        userId,
      },
    });

    if (!supplier) {
      throw new NotFoundException(
        `SUPPLIER_NOT_FOUND: Supplier with ID "${dto.supplierId}" was not found`,
      );
    }

    // 2. Normalize URL and compute fingerprints if sourceUrl is present
    let canonicalUrl: string | undefined = dto.canonicalUrl;
    let urlFingerprint: string | undefined = dto.urlFingerprint;

    if (dto.sourceUrl && (!canonicalUrl || !urlFingerprint)) {
      const normalized = normalizeFeedUrl(dto.sourceUrl);
      canonicalUrl = normalized.canonicalUrl;
      urlFingerprint = normalized.urlFingerprint;
    }

    let contentHash = dto.contentHash;
    if (dto.fileContent && !contentHash) {
      contentHash = computeFeedContentHash(dto.fileContent);
    }

    const matchCandidates = [
      urlFingerprint,
      canonicalUrl,
      dto.sourceUrl?.trim(),
      contentHash,
      dto.fileName?.trim(),
    ].filter((val): val is string => Boolean(val && val.length > 0));

    // 3. Check for same-supplier duplicate in supplierSyncLog
    if (matchCandidates.length > 0) {
      const existingSameSupplierLog = await this.prisma.supplierSyncLog.findFirst({
        where: {
          supplierId: dto.supplierId,
          status: 'SUCCESS',
          feedSourceId: { in: matchCandidates },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (existingSameSupplierLog) {
        this.logger.debug(
          `[CheckFeedCollision] Same-supplier duplicate found for supplier: ${supplier.name}`,
        );
        return {
          hasCollision: true,
          collisionType: FeedCollisionType.SAME_SUPPLIER_DUPLICATE,
          canonicalUrl,
          urlFingerprint,
          existingFeedId: existingSameSupplierLog.feedSourceId || existingSameSupplierLog.id,
          existingFeedName: candidateName,
          conflictingSupplierId: supplier.id,
          conflictingSupplierName: supplier.name,
          existingProductsCount: existingSameSupplierLog.totalProducts,
          lastSyncedAt: (
            existingSameSupplierLog.completedAt || existingSameSupplierLog.createdAt
          ).toISOString(),
          suggestedFeedName: candidateName,
          messageUk: `Цей фід уже підключений до цього постачальника під назвою «${candidateName}». Бажаєте оновити існуючий фід замість створення дубліката?`,
          messageEn: `This feed is already connected to this supplier as «${candidateName}». Would you like to resync the existing feed instead of creating a duplicate?`,
        };
      }

      // 4. Check for cross-supplier conflict across other suppliers owned by this user
      const existingOtherSupplierLog = await this.prisma.supplierSyncLog.findFirst({
        where: {
          supplierId: { not: dto.supplierId },
          supplier: { userId },
          status: 'SUCCESS',
          feedSourceId: { in: matchCandidates },
        },
        include: {
          supplier: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (existingOtherSupplierLog) {
        const otherSupplierName = existingOtherSupplierLog.supplier.name;
        const suggested = generateDisambiguatedFeedName(
          candidateName,
          [candidateName],
          otherSupplierName,
        );
        return {
          hasCollision: true,
          collisionType: FeedCollisionType.CROSS_SUPPLIER_CONFLICT,
          canonicalUrl,
          urlFingerprint,
          existingFeedId: existingOtherSupplierLog.feedSourceId || existingOtherSupplierLog.id,
          existingFeedName: candidateName,
          conflictingSupplierId: existingOtherSupplierLog.supplierId,
          conflictingSupplierName: otherSupplierName,
          existingProductsCount: existingOtherSupplierLog.totalProducts,
          lastSyncedAt: (
            existingOtherSupplierLog.completedAt || existingOtherSupplierLog.createdAt
          ).toISOString(),
          suggestedFeedName: suggested,
          messageUk: `Цей фід вже зареєстрований за постачальником «${otherSupplierName}». Оберіть унікальну назву для ізольованого імпорту.`,
          messageEn: `This feed is already used by supplier «${otherSupplierName}». Choose a unique name for isolated import.`,
        };
      }
    }

    const suggestedFeedName = generateDisambiguatedFeedName(candidateName, [], supplier.name);

    return {
      hasCollision: false,
      collisionType: FeedCollisionType.NONE,
      canonicalUrl,
      urlFingerprint,
      suggestedFeedName,
      messageUk: 'Фід унікальний. Колізій не виявлено.',
      messageEn: 'Feed is unique. No collisions detected.',
    };
  }
}
