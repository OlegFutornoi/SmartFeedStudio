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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SupplierDto } from '@smartfeed/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateSupplierCommand } from './commands/create-supplier.command';
import { UpdateSupplierCommand } from './commands/update-supplier.command';
import { DeleteSupplierCommand } from './commands/delete-supplier.command';
import { GetSuppliersQuery } from './queries/get-suppliers.query';
import { GetSupplierByIdQuery } from './queries/get-supplier-by-id.query';

@ApiTags('Suppliers')
@Controller('suppliers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SuppliersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all suppliers for the authenticated user/organization' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of suppliers' })
  async getSuppliers(
    @CurrentUser('id') userId: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ): Promise<SupplierDto[]> {
    const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;
    return this.queryBus.execute(new GetSuppliersQuery(userId, search, isActiveBool));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single supplier by ID' })
  @ApiResponse({ status: 200, description: 'Supplier details' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async getSupplierById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<SupplierDto> {
    return this.queryBus.execute(new GetSupplierByIdQuery(id, userId));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new supplier with custom pricing markup rules' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  @ApiResponse({ status: 409, description: 'Supplier code already exists' })
  async createSupplier(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSupplierDto,
  ): Promise<SupplierDto> {
    return this.commandBus.execute(new CreateSupplierCommand(userId, dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update supplier details or markup rules' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async updateSupplier(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ): Promise<SupplierDto> {
    return this.commandBus.execute(new UpdateSupplierCommand(id, userId, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a supplier and their associated feeds' })
  @ApiResponse({ status: 200, description: 'Supplier deleted successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async deleteSupplier(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.commandBus.execute(new DeleteSupplierCommand(id, userId));
  }
}
