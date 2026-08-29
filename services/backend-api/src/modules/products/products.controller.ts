import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  PaginatedProductsDto,
  ProductDto,
  ProductCategorySummaryDto,
  BulkDeleteProductsDto,
  BulkDeleteResultDto,
} from '@smartfeed/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterQueryDto } from './dto/product-filter.dto';
import { CreateProductCommand } from './commands/create-product.command';
import { UpdateProductCommand } from './commands/update-product.command';
import { DeleteProductCommand } from './commands/delete-product.command';
import { BulkDeleteProductsCommand } from './commands/bulk-delete-products.command';
import { GetProductsQuery } from './queries/get-products.query';
import { GetProductByIdQuery } from './queries/get-product-by-id.query';
import { GetCategoriesSummaryQuery } from './queries/get-categories-summary.query';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get paginated products with filtering by supplier, category, search, stock',
  })
  @ApiResponse({ status: 200, description: 'Paginated products list' })
  async getProducts(
    @CurrentUser('id') userId: string,
    @Query() filter: ProductFilterQueryDto,
  ): Promise<PaginatedProductsDto> {
    return this.queryBus.execute(new GetProductsQuery(userId, filter));
  }

  @Get('categories-summary')
  @ApiOperation({ summary: 'Get summary of all product categories with SKU counts' })
  @ApiResponse({ status: 200, description: 'List of categories with SKU counts' })
  async getCategoriesSummary(
    @CurrentUser('id') userId: string,
  ): Promise<ProductCategorySummaryDto[]> {
    return this.queryBus.execute(new GetCategoriesSummaryQuery(userId));
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete products by IDs, categories or suppliers' })
  @ApiResponse({ status: 200, description: 'Bulk delete result' })
  async bulkDeleteProducts(
    @CurrentUser('id') userId: string,
    @Body() dto: BulkDeleteProductsDto,
  ): Promise<BulkDeleteResultDto> {
    return this.commandBus.execute(new BulkDeleteProductsCommand(userId, dto));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single product by ID' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<ProductDto> {
    return this.queryBus.execute(new GetProductByIdQuery(id, userId));
  }

  @Post()
  @ApiOperation({ summary: 'Create a product manually with dynamic attributes and images' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 409, description: 'Product with SKU already exists for this supplier' })
  async createProduct(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProductDto,
  ): Promise<ProductDto> {
    return this.commandBus.execute(new CreateProductCommand(userId, dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product by ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductDto> {
    return this.commandBus.execute(new UpdateProductCommand(id, userId, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product by ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProduct(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.commandBus.execute(new DeleteProductCommand(id, userId));
  }
}
