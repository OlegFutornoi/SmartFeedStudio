import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role, PlanType, AccountType } from '@smartfeed/shared';

export class CreateUserByAdminRequestDto {
  @ApiProperty({ example: 'manager@company.com', description: 'User email address' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'User password (min 6 characters)' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ example: 'Іван Коваленко', description: 'User full name' })
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  fullName: string;

  @ApiPropertyOptional({ enum: Role, default: Role.USER, description: 'System security role' })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({
    enum: AccountType,
    default: AccountType.OWNER,
    description: 'Account hierarchy type (ADMIN, OWNER, MEMBER)',
  })
  @IsEnum(AccountType)
  @IsOptional()
  accountType?: AccountType;

  @ApiPropertyOptional({
    example: 'Rozetka Top Sellers LLC',
    description: 'Company/Organization name (for OWNER)',
  })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({
    example: 'cuid12345',
    description: 'Existing organization ID to attach to (for MEMBER)',
  })
  @IsString()
  @IsOptional()
  organizationId?: string;

  @ApiPropertyOptional({
    enum: PlanType,
    example: PlanType.PRO,
    description: 'Initial tariff plan code',
  })
  @IsEnum(PlanType)
  @IsOptional()
  planCode?: PlanType;
}
