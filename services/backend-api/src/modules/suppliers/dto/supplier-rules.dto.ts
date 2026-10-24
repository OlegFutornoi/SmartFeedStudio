import {
  IsOptional,
  IsNumber,
  IsBoolean,
  IsString,
  IsIn,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CustomRoundingRuleItemDto {
  @IsString()
  code: string;

  @IsIn(['DECIMAL', 'INTEGER_ENDING', 'MULTIPLE'])
  type: 'DECIMAL' | 'INTEGER_ENDING' | 'MULTIPLE';

  @IsNumber()
  @Min(0)
  @Max(10000)
  value: number;

  @IsOptional()
  @IsString()
  labelUk?: string;

  @IsOptional()
  @IsString()
  labelEn?: string;
}

export class CreateMarketplaceCategoryDto {
  @IsOptional()
  @IsString()
  marketplaceCode?: string;

  @IsString()
  externalId: string;

  @IsOptional()
  @IsString()
  xmlAttributeName?: string;

  @IsString()
  nameUk: string;

  @IsOptional()
  @IsString()
  nameEn?: string | null;

  @IsOptional()
  @IsString()
  fullPathUk?: string | null;

  @IsOptional()
  @IsString()
  url?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99)
  defaultCommissionPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultFixedFee?: number;
}

export class UpdateSupplierCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(['PERCENT', 'FIXED'])
  markupType?: 'PERCENT' | 'FIXED';

  @IsOptional()
  @IsNumber()
  marginPercent?: number | null;

  @IsOptional()
  @IsNumber()
  fixedMarkup?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99)
  commissionPercent?: number | null;

  @IsOptional()
  @IsString()
  marketplaceCategoryId?: string | null;

  @IsOptional()
  @IsString()
  marketplaceCode?: string | null;

  @IsOptional()
  @IsString()
  externalCategoryId?: string | null;

  @IsOptional()
  @IsString()
  externalCategoryName?: string | null;

  @IsOptional()
  @IsString()
  feedCategoryId?: string;

  @IsOptional()
  @IsString()
  feedSourceId?: string | null;

  @IsOptional()
  @IsString()
  feedName?: string | null;

  @IsOptional()
  @IsNumber()
  productCount?: number;

  @IsOptional()
  marketplaceMappings?: Record<string, unknown>;
}

export class ToggleSupplierCategoryDto {
  @IsBoolean()
  isActive: boolean;
}

export class BatchToggleSupplierCategoriesDto {
  @IsArray()
  @IsString({ each: true })
  categoryIds: string[];

  @IsBoolean()
  isActive: boolean;
}

export class BulkUpsertSupplierCategoryItemDto {
  @IsString()
  feedCategoryId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsString()
  feedSourceId?: string | null;

  @IsOptional()
  @IsString()
  feedName?: string | null;

  @IsOptional()
  @IsNumber()
  productCount?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BulkUpsertSupplierCategoriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpsertSupplierCategoryItemDto)
  categories: BulkUpsertSupplierCategoryItemDto[];
}

export class CreateSupplierPricingRuleDto {
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  categoryNameUk?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number | null;

  @IsOptional()
  @IsNumber()
  marginPercent?: number;

  @IsOptional()
  @IsNumber()
  fixedMarkup?: number;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSupplierPricingRuleDto {
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  categoryNameUk?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number | null;

  @IsOptional()
  @IsNumber()
  marginPercent?: number;

  @IsOptional()
  @IsNumber()
  fixedMarkup?: number;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BulkCreateSupplierPricingRulesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierPricingRuleDto)
  rules: CreateSupplierPricingRuleDto[];

  @IsOptional()
  @IsBoolean()
  replaceExisting?: boolean;
}
