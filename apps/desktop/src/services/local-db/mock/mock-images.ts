import type {
  LocalProductImageDto,
  ProductImageDto,
  UpdateProductImageOrderDto,
  DeleteProductImageResultDto,
} from '@smartfeed/shared';
import { ImageDownloadStatus, ImageSyncStatus } from '@smartfeed/shared';
import type { MockDbState } from '@/services/local-db/mock/mock-state';

export function getProductImages(state: MockDbState, productId: string): LocalProductImageDto[] {
  const product = state.products.find((p) => p.id === productId);
  return ((product?.images as LocalProductImageDto[]) || []).map((img, idx) => ({
    ...img,
    id: img.id || `img_${productId}_${idx}`,
    productId,
    order: img.order ?? idx,
    isMain: img.isMain ?? idx === 0,
    status: (img.status as ImageDownloadStatus) || ImageDownloadStatus.READY,
    syncStatus: (img.syncStatus as ImageSyncStatus) || ImageSyncStatus.LOCAL_ONLY,
  }));
}

export function deleteProductImage(
  state: MockDbState,
  imageId: string,
): DeleteProductImageResultDto {
  let deleted = false;
  let remaining = 0;
  let newMainId: string | null = null;

  for (const prod of state.products) {
    const imagesList = (prod.images as LocalProductImageDto[]) || [];
    const idx = imagesList.findIndex((img) => img.id === imageId);
    if (idx !== -1) {
      const wasMain = imagesList[idx].isMain;
      imagesList.splice(idx, 1);
      deleted = true;
      remaining = imagesList.length;
      if (wasMain && imagesList.length > 0) {
        imagesList[0].isMain = true;
        newMainId = imagesList[0].id || null;
      }
      prod.images = imagesList as unknown as ProductImageDto[];
      break;
    }
  }

  return {
    success: deleted,
    imageId,
    fileDeleted: deleted,
    remainingCount: remaining,
    newMainImageId: newMainId,
  };
}

export function updateImagesOrder(state: MockDbState, payload: UpdateProductImageOrderDto): void {
  const prod = state.products.find((p) => p.id === payload.productId);
  if (!prod || !prod.images) return;

  const currentImages = (prod.images as LocalProductImageDto[]) || [];
  const map = new Map(currentImages.map((img) => [img.id, img]));
  const reordered: LocalProductImageDto[] = [];

  payload.imageIdsInOrder.forEach((id, index) => {
    const img = map.get(id);
    if (img) {
      img.order = index;
      img.isMain = payload.mainImageId ? payload.mainImageId === id : index === 0;
      reordered.push(img);
    }
  });

  prod.images = reordered as unknown as ProductImageDto[];
}

export function downloadProductImage(
  state: MockDbState,
  imageId: string,
  imageUrl: string,
): LocalProductImageDto {
  for (const prod of state.products) {
    const currentImages = (prod.images as LocalProductImageDto[]) || [];
    const img = currentImages.find((i) => i.id === imageId || i.originalUrl === imageUrl);
    if (img) {
      img.status = ImageDownloadStatus.READY;
      img.localPath = `images/originals/00/00/${imageId}.webp`;
      img.thumbnailPath = `images/thumbnails/00/00/${imageId}_thumb.webp`;
      img.fileHash = `hash_${imageId}`;
      img.fileSize = 102400;
      img.retryCount = 0;
      img.updatedAt = new Date().toISOString();
      return img;
    }
  }

  const now = new Date().toISOString();
  return {
    id: imageId,
    productId: '',
    originalUrl: imageUrl,
    localPath: `images/originals/00/00/${imageId}.webp`,
    thumbnailPath: `images/thumbnails/00/00/${imageId}_thumb.webp`,
    fileHash: `hash_${imageId}`,
    fileSize: 102400,
    mimeType: 'image/webp',
    order: 0,
    isMain: false,
    status: ImageDownloadStatus.READY,
    retryCount: 0,
    syncStatus: ImageSyncStatus.LOCAL_ONLY,
    createdAt: now,
    updatedAt: now,
  };
}
