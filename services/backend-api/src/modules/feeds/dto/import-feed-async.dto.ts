import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export enum FeedImportSourceType {
  URL = 'URL',
  FILE = 'FILE',
}

export class ImportFeedAsyncDto {
  @ApiProperty({ description: 'ID of the supplier' })
  @IsNotEmpty({ message: 'supplierId is required' })
  @IsString({ message: 'supplierId must be a string' })
  supplierId: string;

  @ApiProperty({ enum: FeedImportSourceType, description: 'Type of feed source' })
  @IsNotEmpty({ message: 'sourceType is required' })
  @IsEnum(FeedImportSourceType, { message: 'sourceType must be either URL or FILE' })
  sourceType: FeedImportSourceType;

  @ApiPropertyOptional({ description: 'URL of the remote feed' })
  @IsOptional()
  @IsString({ message: 'sourceUrl must be a string' })
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Raw file content if uploaded directly' })
  @IsOptional()
  @IsString({ message: 'fileContent must be a string' })
  fileContent?: string;

  @ApiPropertyOptional({ description: 'Original uploaded file name' })
  @IsOptional()
  @IsString({ message: 'fileName must be a string' })
  @Matches(/\.(xml|yml|csv|tsv|xlsx|xls|txt)$/i, {
    message: 'Invalid feed file extension. Allowed extensions: .xml, .yml, .csv, .tsv, .xlsx, .xls',
  })
  fileName?: string;

  @ApiPropertyOptional({ description: 'Target catalog ID' })
  @IsOptional()
  @IsString({ message: 'catalogId must be a string' })
  catalogId?: string;

  @ApiPropertyOptional({ type: [String], description: 'Selected category IDs for filtering' })
  @IsOptional()
  @IsArray({ message: 'selectedCategoryIds must be an array' })
  @IsString({ each: true, message: 'Each category ID must be a string' })
  selectedCategoryIds?: string[];

  @ApiPropertyOptional({ description: 'Auto-update product prices' })
  @IsOptional()
  @IsBoolean({ message: 'autoUpdatePrices must be a boolean' })
  autoUpdatePrices?: boolean;

  @ApiPropertyOptional({ description: 'Auto-update product stock levels' })
  @IsOptional()
  @IsBoolean({ message: 'autoUpdateStocks must be a boolean' })
  autoUpdateStocks?: boolean;
}
