import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    minLength: 8,
    description:
      'User password (must contain at least 1 uppercase letter, 1 lowercase letter, 1 number)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number',
  })
  password: string;

  @ApiPropertyOptional({ example: 'Олег Довбуш', description: 'Full name' })
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Full name cannot exceed 100 characters' })
  @Matches(/^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\s'\u2019-]+$/u, {
    message: 'Full name can only contain letters, spaces, hyphens, and apostrophes',
  })
  fullName?: string;

  @ApiPropertyOptional({ example: 'Acme Feeds Inc.', description: 'Company / Organization name' })
  @IsString()
  @IsOptional()
  companyName?: string;
}
