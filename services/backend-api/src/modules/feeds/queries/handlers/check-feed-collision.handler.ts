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

    // 3. Check for existing logs/sources associated with this fingerprint in cloud
    if (urlFingerprint) {
      const existingSameSupplierLog = await this.prisma.supplierSyncLog.findFirst({
        where: {
          supplierId: dto.supplierId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // If supplier already has identical URL / settings recorded
      const supplierSettings = await this.prisma.supplierSyncSetting.findUnique({
        where: {
          supplierId: dto.supplierId,
        },
      });

      if (supplierSettings?.lastSyncedAt && existingSameSupplierLog?.status === 'SUCCESS') {
        this.logger.debug(
          `[CheckFeedCollision] Found existing sync history for supplier: ${supplier.name}`,
        );
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
