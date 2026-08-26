import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@smartfeed/shared';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!', minLength: 8, description: 'User password' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: 'Oleg Doe', description: 'Full name' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: 'Acme Feeds Inc.', description: 'Company / Organization name' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ enum: Role, default: Role.USER, description: 'Assigned role' })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
