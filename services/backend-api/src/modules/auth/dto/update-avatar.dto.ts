import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateAvatarDto {
  @ApiProperty({
    example: 'data:image/png;base64,iVBORw0KGgo...',
    description: 'Avatar image URL, base64 data URI, or null/empty to remove',
    required: false,
    nullable: true,
  })
  @ValidateIf((o) => o.avatarUrl !== null && o.avatarUrl !== undefined && o.avatarUrl !== '')
  @IsString()
  @MaxLength(3000000, { message: 'Avatar payload cannot exceed ~3MB' })
  avatarUrl?: string | null;
}
