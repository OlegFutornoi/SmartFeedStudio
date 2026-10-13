import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  IsEmail,
  IsUrl,
} from 'class-validator';
import { CurrencyCode, ExchangeRateMode, PriceRoundingMode } from '@smartfeed/shared';

export class CreateSupplierDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsEnum(CurrencyCode)
  baseCurrency?: CurrencyCode;

  @IsOptional()
  @IsEnum(CurrencyCode)
  targetCurrency?: CurrencyCode;

  @IsOptional()
  @IsEnum(ExchangeRateMode)
  exchangeRateMode?: ExchangeRateMode;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  exchangeRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  currencyBufferPercent?: number;

  @IsOptional()
  @IsEnum(PriceRoundingMode)
  priceRounding?: PriceRoundingMode;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultMarginPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultFixedMarkup?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsEnum(CurrencyCode)
  baseCurrency?: CurrencyCode;

  @IsOptional()
  @IsEnum(CurrencyCode)
  targetCurrency?: CurrencyCode;

  @IsOptional()
  @IsEnum(ExchangeRateMode)
  exchangeRateMode?: ExchangeRateMode;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  exchangeRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  currencyBufferPercent?: number;

  @IsOptional()
  @IsEnum(PriceRoundingMode)
  priceRounding?: PriceRoundingMode;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultMarginPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultFixedMarkup?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

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
