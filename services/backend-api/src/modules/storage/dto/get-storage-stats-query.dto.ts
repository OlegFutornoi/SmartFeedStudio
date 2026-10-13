import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetStorageStatsQueryDto {
  @ApiPropertyOptional({ description: 'Optional workspace path on disk' })
  @IsOptional()
  @IsString()
  path?: string;
}
