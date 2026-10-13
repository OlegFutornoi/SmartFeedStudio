import { IsOptional, IsString, IsEnum, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@smartfeed/shared';

export class GetUsersQueryDto {
  @ApiPropertyOptional({ description: 'Search term for name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: Role, description: 'Filter by user role' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    enum: ['ALL', 'OWNERS', 'MEMBERS'],
    description: 'Filter by organization membership role',
  })
  @IsOptional()
  @IsIn(['ALL', 'OWNERS', 'MEMBERS'])
  orgRoleFilter?: 'ALL' | 'OWNERS' | 'MEMBERS';

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100, description: 'Page limit' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;

  @ApiPropertyOptional({ default: 0, minimum: 0, description: 'Page offset' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}
