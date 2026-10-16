import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  IsEmail,
  ValidateIf,
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
  @ValidateIf((e) => Boolean(e.contactEmail && e.contactEmail.trim().length > 0))
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  segment?: string;

  @IsOptional()
  @IsString()
  managerName?: string;

  @IsOptional()
  @IsString()
  managerPosition?: string;

  @IsOptional()
  @IsString()
  managerPhone?: string;

  @IsOptional()
  @ValidateIf((e) => Boolean(e.managerEmail && e.managerEmail.trim().length > 0))
  @IsEmail()
  managerEmail?: string;

  @IsOptional()
  @IsString()
  managerTelegram?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  postcode?: string;

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
  @ValidateIf((e) => Boolean(e.contactEmail && e.contactEmail.trim().length > 0))
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  segment?: string;

  @IsOptional()
  @IsString()
  managerName?: string;

  @IsOptional()
  @IsString()
  managerPosition?: string;

  @IsOptional()
  @IsString()
  managerPhone?: string;

  @IsOptional()
  @ValidateIf((e) => Boolean(e.managerEmail && e.managerEmail.trim().length > 0))
  @IsEmail()
  managerEmail?: string;

  @IsOptional()
  @IsString()
  managerTelegram?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  postcode?: string;

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
