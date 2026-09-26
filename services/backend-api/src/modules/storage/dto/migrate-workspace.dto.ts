import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MigrateWorkspaceRequestDto {
  @ApiProperty({ description: 'Current path of the workspace' })
  @IsString()
  @IsNotEmpty()
  currentPath: string;

  @ApiProperty({ description: 'New target path for the workspace' })
  @IsString()
  @IsNotEmpty()
  newPath: string;

  @ApiPropertyOptional({ description: 'Whether to move existing files to the new location' })
  @IsBoolean()
  @IsOptional()
  moveExistingData?: boolean;
}
