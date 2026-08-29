import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateProductCommand } from './update-product.command';
import { ProductDto, ProductStatus } from '@smartfeed/shared';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateProductCommand): Promise<ProductDto> {
    const { id, userId, dto } = command;

    const product = await this.prisma.product.findFirst({
      where: {
        id,
        catalog: { userId },
      },
      include: {
        catalog: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    if (dto.sku && dto.sku !== product.sku) {
      const supplierId = dto.supplierId || product.supplierId;
      const skuConflict = await this.prisma.product.findFirst({
        where: {
          catalogId: product.catalogId,
          supplierId,
          sku: dto.sku,
          id: { not: id },
        },
      });
      if (skuConflict) {
        throw new ConflictException(`Product with SKU "${dto.sku}" already exists`);
      }
    }

    // Handle attributes/images updates if provided
    if (dto.attributes !== undefined) {
      await this.prisma.productAttribute.deleteMany({ where: { productId: id } });
    }
    if (dto.images !== undefined) {
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.supplierId !== undefined && { supplierId: dto.supplierId }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.sku !== undefined && { sku: dto.sku }),
        ...(dto.externalId !== undefined && { externalId: dto.externalId }),
        ...(dto.barcode !== undefined && { barcode: dto.barcode }),
        ...(dto.vendorCode !== undefined && { vendorCode: dto.vendorCode }),
        ...(dto.titleUk !== undefined && { titleUk: dto.titleUk }),
        ...(dto.titleEn !== undefined && { titleEn: dto.titleEn }),
        ...(dto.descriptionUk !== undefined && { descriptionUk: dto.descriptionUk }),
        ...(dto.descriptionEn !== undefined && { descriptionEn: dto.descriptionEn }),
        ...(dto.vendor !== undefined && { vendor: dto.vendor }),
        ...(dto.costPrice !== undefined && { costPrice: dto.costPrice }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.oldPrice !== undefined && { oldPrice: dto.oldPrice }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.stockQuantity !== undefined && { stockQuantity: dto.stockQuantity }),
        ...(dto.inStock !== undefined && { inStock: dto.inStock }),
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(dto.images !== undefined && {
          images: {
            create: dto.images.map((img, idx) => ({
              userId,
              originalUrl: img.originalUrl,
              order: img.order !== undefined ? img.order : idx,
              isMain: img.isMain !== undefined ? img.isMain : idx === 0,
            })),
          },
        }),
        ...(dto.attributes !== undefined && {
          attributes: {
            create: dto.attributes.map((attr, idx) => ({
              nameUk: attr.nameUk,
              nameEn: attr.nameEn || null,
              valueUk: attr.valueUk,
              valueEn: attr.valueEn || null,
              unit: attr.unit || null,
              order: attr.order !== undefined ? attr.order : idx,
            })),
          },
        }),
      },
      include: {
        supplier: { select: { name: true, code: true } },
        category: { select: { nameUk: true } },
        images: { orderBy: { order: 'asc' } },
        attributes: { orderBy: { order: 'asc' } },
      },
    });

    return {
      id: updated.id,
      catalogId: updated.catalogId,
      supplierId: updated.supplierId,
      supplierName: updated.supplier.name,
      supplierCode: updated.supplier.code,
      categoryId: updated.categoryId,
      categoryNameUk: updated.category?.nameUk || null,
      sku: updated.sku,
      externalId: updated.externalId,
      barcode: updated.barcode,
      vendorCode: updated.vendorCode,
      titleUk: updated.titleUk,
      titleEn: updated.titleEn,
      descriptionUk: updated.descriptionUk,
      descriptionEn: updated.descriptionEn,
      vendor: updated.vendor,
      costPrice: Number(updated.costPrice),
      price: Number(updated.price),
      oldPrice: updated.oldPrice ? Number(updated.oldPrice) : null,
      currency: updated.currency,
      stockQuantity: updated.stockQuantity,
      inStock: updated.inStock,
      status: updated.status as ProductStatus,
      rawPayload: updated.rawPayload as Record<string, any>,
      images: updated.images.map((img) => ({
        id: img.id,
        originalUrl: img.originalUrl,
        cloudUrl: img.cloudUrl,
        thumbnailUrl: img.thumbnailUrl,
        s3Key: img.s3Key,
        order: img.order,
        isMain: img.isMain,
      })),
      attributes: updated.attributes.map((attr) => ({
        id: attr.id,
        nameUk: attr.nameUk,
        nameEn: attr.nameEn,
        valueUk: attr.valueUk,
        valueEn: attr.valueEn,
        unit: attr.unit,
        order: attr.order,
      })),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
