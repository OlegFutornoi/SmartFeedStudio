import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetProductsQuery } from './get-products.query';
import { PaginatedProductsDto, ProductStatus } from '@smartfeed/shared';

@QueryHandler(GetProductsQuery)
export class GetProductsHandler implements IQueryHandler<GetProductsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetProductsQuery): Promise<PaginatedProductsDto> {
    const { userId, filter } = query;
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      catalog: { userId },
    };

    if (filter.supplierId) {
      where.supplierId = filter.supplierId;
    }

    if (filter.categoryId) {
      where.categoryId = filter.categoryId;
    }

    if (filter.catalogId) {
      where.catalogId = filter.catalogId;
    }

    if (filter.inStock !== undefined) {
      where.inStock = filter.inStock;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.price = {};
      if (filter.minPrice !== undefined) {
        where.price.gte = filter.minPrice;
      }
      if (filter.maxPrice !== undefined) {
        where.price.lte = filter.maxPrice;
      }
    }

    if (filter.search && filter.search.trim()) {
      const s = filter.search.trim();
      where.OR = [
        { titleUk: { contains: s, mode: 'insensitive' } },
        { sku: { contains: s, mode: 'insensitive' } },
        { barcode: { contains: s, mode: 'insensitive' } },
        { vendor: { contains: s, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          supplier: { select: { name: true, code: true } },
          category: { select: { nameUk: true } },
          images: { orderBy: { order: 'asc' } },
          attributes: { orderBy: { order: 'asc' } },
        },
      }),
    ]);

    const items = products.map((product) => ({
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
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
