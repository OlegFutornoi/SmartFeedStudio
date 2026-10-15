import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBankProviderDto {
  @ApiPropertyOptional({ description: 'Display name of the bank' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Short badge code (e.g. NBU, PB, MONO)' })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional({ description: 'URL or SVG path for bank logo' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Whether the bank is active in the system' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Designate this provider as system default' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ enum: ['API_DIRECT', 'COMMERCIAL_SPREAD', 'MANUAL'] })
  @IsOptional()
  @IsEnum(['API_DIRECT', 'COMMERCIAL_SPREAD', 'MANUAL'])
  sourceType?: 'API_DIRECT' | 'COMMERCIAL_SPREAD' | 'MANUAL';

  @ApiPropertyOptional({
    description: 'Sell spread percentage relative to NBU',
    minimum: -10,
    maximum: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(-10)
  @Max(30)
  sellSpreadPercent?: number;

  @ApiPropertyOptional({
    description: 'Buy spread percentage relative to NBU',
    minimum: -30,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(-30)
  @Max(10)
  buySpreadPercent?: number;

  @ApiPropertyOptional({ description: 'Display sort order' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
