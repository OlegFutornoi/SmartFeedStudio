import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OpenFolderRequestDto {
  @ApiProperty({ description: 'Directory path to open' })
  @IsString()
  @IsNotEmpty()
  path: string;
}
