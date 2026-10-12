import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StorageFileCategory } from '@smartfeed/shared';

export class ConfirmUploadDto {
  @ApiProperty({ description: 'S3 Key of uploaded file' })
  @IsString()
  @IsNotEmpty()
  s3Key: string;

  @ApiPropertyOptional({ enum: StorageFileCategory, default: StorageFileCategory.PRODUCT_IMAGE })
  @IsEnum(StorageFileCategory)
  @IsOptional()
  category?: StorageFileCategory;

  @ApiPropertyOptional({ description: 'Original file name' })
  @IsString()
  @IsOptional()
  originalName?: string;

  @ApiPropertyOptional({ description: 'SHA-256 checksum for deduplication' })
  @IsString()
  @IsOptional()
  checksumSha256?: string;

  @ApiPropertyOptional({ description: 'Image width in pixels' })
  @IsInt()
  @Min(1)
  @IsOptional()
  width?: number;

  @ApiPropertyOptional({ description: 'Image height in pixels' })
  @IsInt()
  @Min(1)
  @IsOptional()
  height?: number;
}
