import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FeedSourceType } from '@smartfeed/shared';

export class CheckFeedCollisionDto {
  @ApiProperty({ description: 'ID of the supplier' })
  @IsNotEmpty({ message: 'supplierId is required' })
  @IsString({ message: 'supplierId must be a string' })
  supplierId: string;

  @ApiPropertyOptional({ enum: FeedSourceType, description: 'Type of feed source' })
  @IsOptional()
  @IsEnum(FeedSourceType, { message: 'sourceType must be either URL or FILE' })
  sourceType?: FeedSourceType;

  @ApiPropertyOptional({ description: 'Raw feed URL' })
  @IsOptional()
  @IsString({ message: 'sourceUrl must be a string' })
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Normalized canonical URL' })
  @IsOptional()
  @IsString({ message: 'canonicalUrl must be a string' })
  canonicalUrl?: string;

  @ApiPropertyOptional({ description: 'SHA-256 URL fingerprint' })
  @IsOptional()
  @IsString({ message: 'urlFingerprint must be a string' })
  urlFingerprint?: string;

  @ApiPropertyOptional({ description: 'Uploaded feed file name' })
  @IsOptional()
  @IsString({ message: 'fileName must be a string' })
  fileName?: string;

  @ApiPropertyOptional({ description: 'Desired feed name' })
  @IsOptional()
  @IsString({ message: 'feedName must be a string' })
  feedName?: string;

  @ApiPropertyOptional({ description: 'Raw file content' })
  @IsOptional()
  @IsString({ message: 'fileContent must be a string' })
  fileContent?: string;

  @ApiPropertyOptional({ description: 'SHA-256 content hash' })
  @IsOptional()
  @IsString({ message: 'contentHash must be a string' })
  contentHash?: string;
}
