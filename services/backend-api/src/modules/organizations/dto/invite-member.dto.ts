import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { MemberRole } from '@smartfeed/shared';

export class InviteMemberDto {
  @ApiProperty({
    example: 'colleague@example.com',
    description: 'Email address of member to add/invite',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    enum: MemberRole,
    default: MemberRole.MEMBER,
    description: 'Role within organization',
  })
  @IsEnum(MemberRole)
  @IsOptional()
  role?: MemberRole;
}
