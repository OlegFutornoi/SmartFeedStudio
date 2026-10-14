import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetWorkspaceInfoQueryDto {
  @ApiPropertyOptional({ description: 'Optional workspace path on disk' })
  @IsOptional()
  @IsString()
  path?: string;
}
