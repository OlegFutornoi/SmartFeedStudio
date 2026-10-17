import type {
  CheckFeedCollisionDto,
  FeedCollisionResultDto,
  FeedSourceDto,
} from '@smartfeed/shared';
import {
  FeedCollisionType,
  normalizeFeedUrl,
  areFeedUrlsEquivalent,
  extractBaseFeedUrl,
  computeFeedContentHash,
} from '@smartfeed/shared';
import type { MockDbState } from '@/services/local-db/mock/mock-state';
import { getSupplierById } from '@/services/local-db/mock/mock-suppliers';

export function checkFeedCollision(
  state: MockDbState,
  dto: CheckFeedCollisionDto,
): FeedCollisionResultDto {
  const candidateName = dto.feedName?.trim() || dto.fileName?.trim() || 'Фід товарів';
  const targetUrl = dto.sourceUrl?.trim();

  // Normalize candidate URL
  let targetCanonical = dto.canonicalUrl?.trim();
  let targetFp = dto.urlFingerprint?.trim();
  let targetBaseUrl = '';

  if (targetUrl) {
    const norm = normalizeFeedUrl(targetUrl);
    targetCanonical = targetCanonical || norm.canonicalUrl;
    targetFp = targetFp || norm.urlFingerprint;
    targetBaseUrl = norm.baseFeedUrl;
  }

  // Compute file content hash if file content is provided
  const targetContentHash =
    dto.contentHash?.trim() ||
    (dto.fileContent ? computeFeedContentHash(dto.fileContent) : undefined);

  // Matching helper across all URL and File strategies
  const isFeedMatch = (f: FeedSourceDto): boolean => {
    // 1. URL match
    if (targetUrl || targetFp) {
      if (targetFp && f.urlFingerprint && f.urlFingerprint === targetFp) return true;
      if (targetCanonical && f.canonicalUrl && f.canonicalUrl === targetCanonical) return true;
      if (targetUrl && f.sourceUrl && areFeedUrlsEquivalent(targetUrl, f.sourceUrl)) return true;
      if (targetBaseUrl && f.sourceUrl && extractBaseFeedUrl(f.sourceUrl) === targetBaseUrl)
        return true;
    }
    // 2. File content hash match
    if (targetContentHash && f.contentHash && f.contentHash === targetContentHash) {
      return true;
    }
    // 3. File name exact match for file source type
    if (
      dto.fileName &&
      f.name &&
      f.name.trim().toLowerCase() === dto.fileName.trim().toLowerCase()
    ) {
      return true;
    }
    return false;
  };

  // Name matching helper
  const isNameMatch = (f: FeedSourceDto): boolean => {
    if (!candidateName) return false;
    return f.name.trim().toLowerCase() === candidateName.trim().toLowerCase();
  };

  // 1. Same-supplier duplicate check (if supplierId is provided)
  if (dto.supplierId) {
    const supplierSources = state.feedSources.get(dto.supplierId) || [];
    const sameSupExisting = supplierSources.find((f) => isFeedMatch(f));
    if (sameSupExisting) {
      return {
        hasCollision: true,
        collisionType: FeedCollisionType.SAME_SUPPLIER_DUPLICATE,
        canonicalUrl: targetCanonical,
        urlFingerprint: targetFp,
        existingFeedId: sameSupExisting.id,
        existingFeedName: sameSupExisting.name,
        conflictingSupplierId: dto.supplierId,
        existingProductsCount: sameSupExisting.productsCount ?? 0,
        lastSyncedAt: sameSupExisting.lastSyncedAt
          ? String(sameSupExisting.lastSyncedAt)
          : undefined,
        suggestedFeedName: sameSupExisting.name,
        messageUk: `Цей фід уже підключений до цього постачальника під назвою «${sameSupExisting.name}». Бажаєте оновити існуючий фід замість створення дубліката?`,
        messageEn: `This feed is already connected to this supplier as «${sameSupExisting.name}». Would you like to resync the existing feed instead of creating a duplicate?`,
      };
    }
  }

  // 2. Cross-supplier conflict check (or duplicate if supplierId not specified)
  for (const [supId, sources] of state.feedSources.entries()) {
    if (!dto.supplierId || supId !== dto.supplierId) {
      const otherExisting = sources.find((f) => isFeedMatch(f));
      if (otherExisting) {
        const otherSup = getSupplierById(state, supId);
        const supName = otherSup?.name || 'інший постачальник';
        const isDisambiguated =
          candidateName.toLowerCase() !== otherExisting.name.toLowerCase() &&
          (candidateName.toLowerCase().includes(supName.toLowerCase()) ||
            candidateName.includes(' ['));

        if (!isDisambiguated) {
          const suggested = `${otherExisting.name} [${supName}]`;
          return {
            hasCollision: true,
            collisionType: dto.supplierId
              ? FeedCollisionType.CROSS_SUPPLIER_CONFLICT
              : FeedCollisionType.SAME_SUPPLIER_DUPLICATE,
            canonicalUrl: targetCanonical,
            urlFingerprint: targetFp,
            existingFeedId: otherExisting.id,
            existingFeedName: otherExisting.name,
            conflictingSupplierId: supId,
            conflictingSupplierName: supName,
            existingProductsCount: otherExisting.productsCount ?? 0,
            lastSyncedAt: otherExisting.lastSyncedAt
              ? String(otherExisting.lastSyncedAt)
              : undefined,
            suggestedFeedName: suggested,
            messageUk: `Цей фід вже зареєстрований за постачальником «${supName}». Оберіть унікальну назву для ізольованого імпорту.`,
            messageEn: `This feed is already used by supplier «${supName}». Choose a unique name for isolated import.`,
          };
        }
      }
    }
  }

  // 3. Name collision within the same supplier
  if (dto.supplierId && candidateName) {
    const supplierSources = state.feedSources.get(dto.supplierId) || [];
    const sameName = supplierSources.find((f) => isNameMatch(f));
    if (sameName) {
      const suggested = `${candidateName} #${supplierSources.length + 1}`;
      return {
        hasCollision: true,
        collisionType: FeedCollisionType.NAME_COLLISION,
        canonicalUrl: targetCanonical,
        urlFingerprint: targetFp,
        existingFeedId: sameName.id,
        existingFeedName: sameName.name,
        conflictingSupplierId: dto.supplierId,
        suggestedFeedName: suggested,
        messageUk: `Фід із назвою «${candidateName}» вже існує для цього постачальника. Назву автоматично змінено для унікальності.`,
        messageEn: `A feed named «${candidateName}» already exists for this supplier. Name has been adjusted for uniqueness.`,
      };
    }
  }

  return {
    hasCollision: false,
    collisionType: FeedCollisionType.NONE,
    canonicalUrl: targetCanonical,
    urlFingerprint: targetFp,
    suggestedFeedName: candidateName,
    messageUk: 'Фід унікальний. Колізій не виявлено.',
    messageEn: 'Feed is unique. No collisions detected.',
  };
}
