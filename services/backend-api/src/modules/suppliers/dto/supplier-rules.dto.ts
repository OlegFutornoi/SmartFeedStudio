import { IsOptional, IsNumber, IsBoolean, IsString, Min } from 'class-validator';

export class UpdateSupplierCategoryDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  marginPercent?: number | null;

  @IsOptional()
  @IsNumber()
  fixedMarkup?: number | null;
}

export class CreateSupplierPricingRuleDto {
  @IsOptional()
  @IsString()
  categoryId?: string | null;

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
