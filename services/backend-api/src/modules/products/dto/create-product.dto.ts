import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsNumber,
  Min,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '@smartfeed/shared';

export class ProductImageInputDto {
  @ApiProperty({ example: 'https://example.com/photo.jpg' })
  @IsString()
  @IsNotEmpty()
  originalUrl: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}

export class ProductAttributeInputDto {
  @ApiProperty({ example: 'Розмір' })
  @IsString()
  @IsNotEmpty()
  nameUk: string;

  @ApiPropertyOptional({ example: 'Size' })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiProperty({ example: 'XL' })
  @IsString()
  @IsNotEmpty()
  valueUk: string;

  @ApiPropertyOptional({ example: 'XL' })
  @IsOptional()
  @IsString()
  valueEn?: string;

  @ApiPropertyOptional({ example: 'см' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class CreateProductDto {
  @ApiPropertyOptional({ example: 'cat_default' })
  @IsOptional()
  @IsString()
  catalogId?: string;

  @ApiProperty({ example: 'supp_123' })
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @ApiPropertyOptional({ example: 'category_123' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ example: 'TSHIRT-WHITE-XL' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiPropertyOptional({ example: 'EXT-992' })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional({ example: '4820000000000' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: 'VC-01' })
  @IsOptional()
  @IsString()
  vendorCode?: string;

  @ApiProperty({ example: 'Футболка бавовняна біла' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  titleUk: string;

  @ApiPropertyOptional({ example: 'Cotton T-Shirt White' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional({ example: 'Високоякісна футболка' })
  @IsOptional()
  @IsString()
  descriptionUk?: string;

  @ApiPropertyOptional({ example: 'High quality t-shirt' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ example: 'Nike' })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({ example: 250, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiProperty({ example: 350 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 450 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  oldPrice?: number;

  @ApiPropertyOptional({ example: 'UAH', default: 'UAH' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 42, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ type: [ProductImageInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  images?: ProductImageInputDto[];

  @ApiPropertyOptional({ type: [ProductAttributeInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeInputDto)
  attributes?: ProductAttributeInputDto[];
}
