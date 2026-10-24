import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsEmail,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyCode, ExchangeRateMode, PriceRoundingMode } from '@smartfeed/shared';
import { CustomRoundingRuleItemDto } from '@/modules/suppliers/dto/supplier-rules.dto';

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
  @IsString()
  priceRounding?: PriceRoundingMode | string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomRoundingRuleItemDto)
  customRoundingRules?: CustomRoundingRuleItemDto[];

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

  @IsOptional()
  @IsString()
  selectedBankId?: string | null;
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
  @IsString()
  priceRounding?: PriceRoundingMode | string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomRoundingRuleItemDto)
  customRoundingRules?: CustomRoundingRuleItemDto[];

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

  @IsOptional()
  @IsString()
  selectedBankId?: string | null;
}

export {
  CustomRoundingRuleItemDto,
  UpdateSupplierCategoryDto,
  ToggleSupplierCategoryDto,
  BatchToggleSupplierCategoriesDto,
  BulkUpsertSupplierCategoriesDto,
  CreateSupplierPricingRuleDto,
  UpdateSupplierPricingRuleDto,
  BulkCreateSupplierPricingRulesDto,
} from '@/modules/suppliers/dto/supplier-rules.dto';
