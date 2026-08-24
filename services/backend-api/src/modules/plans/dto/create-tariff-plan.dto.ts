import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  Min,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateTariffPlanDto {
  @ApiProperty({ example: 'PRO', description: 'Unique uppercase plan code identifier' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'Code must be uppercase alphanumeric with underscores or dashes',
  })
  code: string;

  @ApiProperty({ example: 'Професійний', description: 'Plan display name in Ukrainian' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nameUk: string;

  @ApiProperty({ example: 'Pro Plan', description: 'Plan display name in English' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nameEn: string;

  @ApiPropertyOptional({ example: 'Для інтернет-магазинів із розширеним каталогом' })
  @IsString()
  @IsOptional()
  descriptionUk?: string;

  @ApiPropertyOptional({ example: 'For online stores with expanded catalog' })
  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @ApiProperty({ example: 49.0, description: 'Monthly price in USD' })
  @IsNumber()
  @Min(0)
  priceMonthly: number;

  @ApiPropertyOptional({ example: 490.0, description: 'Yearly price in USD' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  priceYearly?: number;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: 50000, description: 'Maximum product items limit' })
  @IsNumber()
  @Min(1)
  maxXmlLimit: number;

  @ApiProperty({ example: 500, description: 'Monthly AI enrichment credits' })
  @IsNumber()
  @Min(0)
  aiCredits: number;

  @ApiPropertyOptional({ example: true, default: false })
  @IsBoolean()
  @IsOptional()
  canCloudBackup?: boolean;

  @ApiPropertyOptional({ example: true, default: false })
  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 2, default: 0 })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({
    example: ['До 50,000 позицій XML', '500 AI кредитів', 'S3 Cloud Backup'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  featuresUk?: string[];

  @ApiPropertyOptional({
    example: ['Up to 50,000 XML items', '500 AI credits', 'S3 Cloud Backup'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  featuresEn?: string[];
}
