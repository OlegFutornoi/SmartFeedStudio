import type {
  LocalProductImageDto,
  UpdateProductImageOrderDto,
  DeleteProductImageResultDto,
} from '@smartfeed/shared';
import { invokeLocalDb } from '@/services/local-db/client';

export class LocalImagesService {
  async getProductImages(productId: string): Promise<LocalProductImageDto[]> {
    return invokeLocalDb('db_get_product_images', { productId });
  }

  async deleteProductImage(imageId: string): Promise<DeleteProductImageResultDto> {
    return invokeLocalDb('db_delete_product_image', { imageId });
  }

  async updateImagesOrder(payload: UpdateProductImageOrderDto): Promise<void> {
    return invokeLocalDb('db_update_product_images_order', { payload });
  }

  async downloadProductImage(imageId: string, imageUrl: string): Promise<LocalProductImageDto> {
    return invokeLocalDb('db_download_product_image', { imageId, imageUrl });
  }
}

export const localImagesService = new LocalImagesService();
