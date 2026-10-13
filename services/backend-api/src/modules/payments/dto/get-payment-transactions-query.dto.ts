import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus, PaymentProvider } from '@smartfeed/shared';

export class GetPaymentTransactionsQueryDto {
  @ApiPropertyOptional({ enum: PaymentStatus, description: 'Filter by transaction status' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ enum: PaymentProvider, description: 'Filter by payment provider' })
  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;

  @ApiPropertyOptional({ description: 'Search term for invoice, user email, or reference' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100, description: 'Page limit' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;

  @ApiPropertyOptional({ default: 0, minimum: 0, description: 'Page offset' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}

export class GetMyTransactionsQueryDto {
  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100, description: 'Page limit' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ default: 0, minimum: 0, description: 'Page offset' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}
