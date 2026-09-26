import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceActionRequestDto {
  @ApiProperty({ description: 'Path of the workspace' })
  @IsString()
  @IsNotEmpty()
  workspacePath: string;
}
