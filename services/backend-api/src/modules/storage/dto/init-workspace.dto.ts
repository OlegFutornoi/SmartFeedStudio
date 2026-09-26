import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitWorkspaceRequestDto {
  @ApiProperty({ description: 'Local path where workspace will be initialized' })
  @IsString()
  @IsNotEmpty()
  workspacePath: string;

  @ApiPropertyOptional({ description: 'Whether to enable encryption for the workspace' })
  @IsBoolean()
  @IsOptional()
  enableEncryption?: boolean;
}
