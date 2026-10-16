// @golden - Reference pattern for query DTO with enum validation (BE-01)
import { IsEnum, IsOptional } from 'class-validator';
import { CurrencyCode } from '@smartfeed/shared';

export class GetLiveBankRatesQueryDto {
  @IsOptional()
  @IsEnum(CurrencyCode)
  currency?: CurrencyCode;
}
