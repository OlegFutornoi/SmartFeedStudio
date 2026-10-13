import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CleanupOrphansDto {
  @ApiPropertyOptional({
    description: 'Dry run flag to inspect orphaned files without deleting them',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({
    description: 'Target folder to scan for orphans (images, snapshots, catalogs)',
    default: 'images',
  })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional({
    description: 'List of currently active S3 keys / file identifiers used in the active catalog',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activeKeys?: string[];
}
