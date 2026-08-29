import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetProductByIdQuery } from './get-product-by-id.query';
import { ProductDto, ProductStatus } from '@smartfeed/shared';

@QueryHandler(GetProductByIdQuery)
export class GetProductByIdHandler implements IQueryHandler<GetProductByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetProductByIdQuery): Promise<ProductDto> {
    const { id, userId } = query;

    const product = await this.prisma.product.findFirst({
      where: {
        id,
        catalog: { userId },
      },
      include: {
        supplier: { select: { name: true, code: true } },
        category: { select: { nameUk: true } },
        images: { orderBy: { order: 'asc' } },
        attributes: { orderBy: { order: 'asc' } },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return {
      id: product.id,
      catalogId: product.catalogId,
      supplierId: product.supplierId,
      supplierName: product.supplier.name,
      supplierCode: product.supplier.code,
      categoryId: product.categoryId,
      categoryNameUk: product.category?.nameUk || null,
      sku: product.sku,
      externalId: product.externalId,
      barcode: product.barcode,
      vendorCode: product.vendorCode,
      titleUk: product.titleUk,
      titleEn: product.titleEn,
      descriptionUk: product.descriptionUk,
      descriptionEn: product.descriptionEn,
      vendor: product.vendor,
      costPrice: Number(product.costPrice),
      price: Number(product.price),
      oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
      currency: product.currency,
      stockQuantity: product.stockQuantity,
      inStock: product.inStock,
      status: product.status as ProductStatus,
      rawPayload: product.rawPayload as Record<string, any>,
      images: product.images.map((img) => ({
        id: img.id,
        originalUrl: img.originalUrl,
        cloudUrl: img.cloudUrl,
        thumbnailUrl: img.thumbnailUrl,
        s3Key: img.s3Key,
        order: img.order,
        isMain: img.isMain,
      })),
      attributes: product.attributes.map((attr) => ({
        id: attr.id,
        nameUk: attr.nameUk,
        nameEn: attr.nameEn,
        valueUk: attr.valueUk,
        valueEn: attr.valueEn,
        unit: attr.unit,
        order: attr.order,
      })),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
