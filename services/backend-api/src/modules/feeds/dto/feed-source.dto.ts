import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { FeedFormat, FeedSourceType } from '@smartfeed/shared';

export class CreateSupplierFeedSourceDto {
  @ApiProperty({ description: 'Name of the feed source' })
  @IsNotEmpty({ message: 'name is required' })
  @IsString({ message: 'name must be a string' })
  name: string;

  @ApiPropertyOptional({ enum: FeedSourceType, default: FeedSourceType.URL })
  @IsOptional()
  @IsEnum(FeedSourceType, { message: 'sourceType must be either URL or FILE' })
  sourceType?: FeedSourceType;

  @ApiPropertyOptional({ enum: FeedFormat, default: FeedFormat.XML_ROZETKA })
  @IsOptional()
  @IsEnum(FeedFormat, { message: 'fileFormat must be a valid FeedFormat' })
  fileFormat?: FeedFormat;

  @ApiPropertyOptional({ description: 'Source URL' })
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Canonical URL' })
  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @ApiPropertyOptional({ description: 'URL fingerprint' })
  @IsOptional()
  @IsString()
  urlFingerprint?: string;

  @ApiPropertyOptional({ description: 'Content hash' })
  @IsOptional()
  @IsString()
  contentHash?: string;

  @ApiPropertyOptional({ description: 'Parent feed source ID' })
  @IsOptional()
  @IsString()
  parentFeedSourceId?: string;

  @ApiPropertyOptional({ description: 'S3 file key' })
  @IsOptional()
  @IsString()
  s3FileKey?: string;

  @ApiPropertyOptional({ description: 'Auth header name' })
  @IsOptional()
  @IsString()
  authHeaderName?: string;

  @ApiPropertyOptional({ description: 'Auth header value' })
  @IsOptional()
  @IsString()
  authHeaderValue?: string;

  @ApiPropertyOptional({ description: 'Sync interval in hours', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  syncIntervalHours?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoUpdatePrices?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoUpdateStocks?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoCreateNewProducts?: boolean;

  @ApiPropertyOptional({ description: 'Mapping rules JSON' })
  @IsOptional()
  mappingRules?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Estimated products count', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  productsCount?: number;
}

export class UpdateSupplierFeedSourceDto {
  @ApiPropertyOptional({ description: 'Name of the feed source' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Source URL' })
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Canonical URL' })
  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @ApiPropertyOptional({ description: 'URL fingerprint' })
  @IsOptional()
  @IsString()
  urlFingerprint?: string;

  @ApiPropertyOptional({ description: 'Content hash' })
  @IsOptional()
  @IsString()
  contentHash?: string;

  @ApiPropertyOptional({ description: 'Parent feed source ID' })
  @IsOptional()
  @IsString()
  parentFeedSourceId?: string;

  @ApiPropertyOptional({ description: 'S3 file key' })
  @IsOptional()
  @IsString()
  s3FileKey?: string;

  @ApiPropertyOptional({ description: 'Auth header name' })
  @IsOptional()
  @IsString()
  authHeaderName?: string;

  @ApiPropertyOptional({ description: 'Auth header value' })
  @IsOptional()
  @IsString()
  authHeaderValue?: string;

  @ApiPropertyOptional({ description: 'Sync interval in hours' })
  @IsOptional()
  @IsInt()
  @Min(0)
  syncIntervalHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoUpdatePrices?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoUpdateStocks?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoCreateNewProducts?: boolean;

  @ApiPropertyOptional({ description: 'Mapping rules JSON' })
  @IsOptional()
  mappingRules?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Estimated products count' })
  @IsOptional()
  @IsInt()
  @Min(0)
  productsCount?: number;

  @ApiPropertyOptional({ description: 'Last synced at' })
  @IsOptional()
  lastSyncedAt?: Date | string;

  @ApiPropertyOptional({ description: 'Last sync status' })
  @IsOptional()
  @IsString()
  lastSyncStatus?: string;
}
