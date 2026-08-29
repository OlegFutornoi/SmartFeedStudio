import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProductCommand } from './create-product.command';
import { ProductDto, ProductStatus } from '@smartfeed/shared';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateProductCommand): Promise<ProductDto> {
    const { userId, dto } = command;

    // 1. Verify supplier belongs to user
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, userId },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID "${dto.supplierId}" not found`);
    }

    // 2. Resolve or create default ProductCatalog for user
    let catalogId = dto.catalogId;
    if (!catalogId) {
      let defaultCatalog = await this.prisma.productCatalog.findFirst({
        where: { userId, isDefault: true },
      });
      if (!defaultCatalog) {
        defaultCatalog = await this.prisma.productCatalog.create({
          data: {
            userId,
            name: 'Головний каталог товарів',
            isDefault: true,
          },
        });
      }
      catalogId = defaultCatalog.id;
    }

    // 3. Check SKU uniqueness in catalog + supplier
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        catalogId_supplierId_sku: {
          catalogId,
          supplierId: dto.supplierId,
          sku: dto.sku,
        },
      },
    });

    if (existingProduct) {
      throw new ConflictException(
        `Product with SKU "${dto.sku}" already exists for supplier "${supplier.name}"`,
      );
    }

    // 4. Create Product with Images and Attributes
    const product = await this.prisma.product.create({
      data: {
        catalogId,
        supplierId: dto.supplierId,
        categoryId: dto.categoryId || null,
        sku: dto.sku,
        externalId: dto.externalId || null,
        barcode: dto.barcode || null,
        vendorCode: dto.vendorCode || null,
        titleUk: dto.titleUk,
        titleEn: dto.titleEn || null,
        descriptionUk: dto.descriptionUk || null,
        descriptionEn: dto.descriptionEn || null,
        vendor: dto.vendor || null,
        costPrice: dto.costPrice ?? 0,
        price: dto.price,
        oldPrice: dto.oldPrice || null,
        currency: dto.currency || 'UAH',
        stockQuantity: dto.stockQuantity ?? 0,
        inStock: dto.inStock !== undefined ? dto.inStock : true,
        status: (dto.status as any) || ProductStatus.ACTIVE,
        images:
          dto.images && dto.images.length > 0
            ? {
                create: dto.images.map((img, idx) => ({
                  userId,
                  originalUrl: img.originalUrl,
                  order: img.order !== undefined ? img.order : idx,
                  isMain: img.isMain !== undefined ? img.isMain : idx === 0,
                })),
              }
            : undefined,
        attributes:
          dto.attributes && dto.attributes.length > 0
            ? {
                create: dto.attributes.map((attr, idx) => ({
                  nameUk: attr.nameUk,
                  nameEn: attr.nameEn || null,
                  valueUk: attr.valueUk,
                  valueEn: attr.valueEn || null,
                  unit: attr.unit || null,
                  order: attr.order !== undefined ? attr.order : idx,
                })),
              }
            : undefined,
      },
      include: {
        supplier: {
          select: { name: true, code: true },
        },
        category: {
          select: { nameUk: true },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        attributes: {
          orderBy: { order: 'asc' },
        },
      },
    });

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
