import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { UpdateUserStatusDto } from '@smartfeed/shared';

export class UpdateUserStatusRequestDto implements UpdateUserStatusDto {
  @ApiProperty({ example: true, description: 'User active (true) or suspended (false) status' })
  @IsBoolean()
  isActive: boolean;
}
