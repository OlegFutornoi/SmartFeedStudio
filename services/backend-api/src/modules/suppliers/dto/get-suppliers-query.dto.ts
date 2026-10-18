import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetSuppliersQueryDto {
  @ApiPropertyOptional({ description: 'Search query for supplier name or code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by status (e.g. active, inactive)' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class GetSupplierCategoriesQueryDto {
  @ApiPropertyOptional({ description: 'Search query for category name' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class GetMarketplaceCategoriesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by marketplace code (e.g. ROZETKA, PROM, EPICENTR)' })
  @IsOptional()
  @IsString()
  marketplaceCode?: string;

  @ApiPropertyOptional({ description: 'Search query by category name or external ID' })
  @IsOptional()
  @IsString()
  search?: string;
}
