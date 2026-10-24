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
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  UpdateSupplierCategoryDto,
  CreateSupplierPricingRuleDto,
  UpdateSupplierPricingRuleDto,
  ToggleSupplierCategoryDto,
  BatchToggleSupplierCategoriesDto,
  BulkUpsertSupplierCategoriesDto,
  BulkCreateSupplierPricingRulesDto,
} from '@/modules/suppliers/dto/supplier.dto';
import {
  GetSuppliersQueryDto,
  GetSupplierCategoriesQueryDto,
} from '@/modules/suppliers/dto/get-suppliers-query.dto';
import {
  GetSuppliersQuery,
  GetSupplierByIdQuery,
  GetSupplierCategoriesQuery,
  GetSupplierPricingRulesQuery,
  GetSupplierSyncSettingsQuery,
  GetSupplierSyncLogsQuery,
} from '@/modules/suppliers/queries/suppliers.queries';
import {
  CreateSupplierCommand,
  UpdateSupplierCommand,
  DeleteSupplierCommand,
  UpdateSupplierCategoryCommand,
  ToggleSupplierCategoryCommand,
  BatchToggleSupplierCategoriesCommand,
  BulkUpsertSupplierCategoriesCommand,
  DeleteSupplierCategoryCommand,
  CreateSupplierPricingRuleCommand,
  UpdateSupplierPricingRuleCommand,
  DeleteSupplierPricingRuleCommand,
  BulkCreateSupplierPricingRulesCommand,
  UpdateSupplierSyncSettingsCommand,
  SyncSupplierFeedCommand,
  ClearSupplierSyncLogsCommand,
} from '@/modules/suppliers/commands/suppliers.commands';
import {
  UpdateSupplierSyncSettingDto,
  TriggerSupplierSyncDto,
  GetSupplierSyncLogsQueryDto,
} from '@/modules/suppliers/dto/supplier-sync.dto';

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
  @ApiOperation({ summary: 'Get list of suppliers for current user' })
  @ApiResponse({ status: 200, description: 'List of suppliers' })
  async getSuppliers(@CurrentUser() user: { id: string }, @Query() query: GetSuppliersQueryDto) {
    return this.queryBus.execute(new GetSuppliersQuery(user.id, query.search));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier by id' })
  @ApiResponse({ status: 200, description: 'Supplier details' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async getSupplierById(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.queryBus.execute(new GetSupplierByIdQuery(id, user.id));
  }

  @Post()
  @ApiOperation({ summary: 'Create new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created' })
  async createSupplier(@CurrentUser() user: { id: string }, @Body() dto: CreateSupplierDto) {
    return this.commandBus.execute(new CreateSupplierCommand(user.id, dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update existing supplier' })
  @ApiResponse({ status: 200, description: 'Supplier updated' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async updateSupplier(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.commandBus.execute(new UpdateSupplierCommand(id, user.id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete supplier with cascade cleanup' })
  @ApiResponse({ status: 200, description: 'Supplier deleted' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async deleteSupplier(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.commandBus.execute(new DeleteSupplierCommand(id, user.id));
  }

  // Categories
  @Get(':id/categories')
  @ApiOperation({ summary: 'Get category rules for supplier' })
  async getCategories(
    @Param('id') supplierId: string,
    @CurrentUser() user: { id: string },
    @Query() query: GetSupplierCategoriesQueryDto,
  ) {
    return this.queryBus.execute(new GetSupplierCategoriesQuery(supplierId, user.id, query.search));
  }

  @Post(':id/categories/bulk-upsert')
  @ApiOperation({ summary: 'Bulk upsert category rules from feed' })
  async bulkUpsertCategories(
    @Param('id') supplierId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: BulkUpsertSupplierCategoriesDto,
  ) {
    return this.commandBus.execute(
      new BulkUpsertSupplierCategoriesCommand(supplierId, user.id, dto.categories),
    );
  }

  @Patch(':id/categories/:categoryId/toggle')
  @ApiOperation({ summary: 'Toggle category active status' })
  async toggleCategory(
    @Param('id') supplierId: string,
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ToggleSupplierCategoryDto,
  ) {
    return this.commandBus.execute(
      new ToggleSupplierCategoryCommand(supplierId, categoryId, user.id, dto.isActive),
    );
  }

  @Post(':id/categories/batch-toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch toggle categories active status' })
  async batchToggleCategories(
    @Param('id') supplierId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: BatchToggleSupplierCategoriesDto,
  ) {
    return this.commandBus.execute(
      new BatchToggleSupplierCategoriesCommand(supplierId, user.id, dto.categoryIds, dto.isActive),
    );
  }

  @Patch(':id/categories/:categoryId')
  @ApiOperation({ summary: 'Update markup, marketplace mapping or status of category' })
  async updateCategory(
    @Param('id') supplierId: string,
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateSupplierCategoryDto,
  ) {
    return this.commandBus.execute(
      new UpdateSupplierCategoryCommand(supplierId, categoryId, user.id, dto),
    );
  }

  @Delete(':id/categories/:categoryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete category rule' })
  async deleteCategory(
    @Param('id') supplierId: string,
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.commandBus.execute(
      new DeleteSupplierCategoryCommand(supplierId, categoryId, user.id),
    );
  }

  // Pricing Rules
  @Get(':id/pricing-rules')
  @ApiOperation({ summary: 'Get pricing rules for supplier' })
  async getPricingRules(@Param('id') supplierId: string, @CurrentUser() user: { id: string }) {
    return this.queryBus.execute(new GetSupplierPricingRulesQuery(supplierId, user.id));
  }

  @Post(':id/pricing-rules')
  @ApiOperation({ summary: 'Create pricing tier rule' })
  async createPricingRule(
    @Param('id') supplierId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateSupplierPricingRuleDto,
  ) {
    return this.commandBus.execute(new CreateSupplierPricingRuleCommand(supplierId, user.id, dto));
  }

  @Post(':id/pricing-rules/bulk')
  @ApiOperation({ summary: 'Bulk create pricing tier rules' })
  async bulkCreatePricingRules(
    @Param('id') supplierId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: BulkCreateSupplierPricingRulesDto,
  ) {
    return this.commandBus.execute(
      new BulkCreateSupplierPricingRulesCommand(supplierId, user.id, dto),
    );
  }

  @Patch(':id/pricing-rules/:ruleId')
  @ApiOperation({ summary: 'Update pricing tier rule' })
  async updatePricingRule(
    @Param('id') supplierId: string,
    @Param('ruleId') ruleId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateSupplierPricingRuleDto,
  ) {
    return this.commandBus.execute(
      new UpdateSupplierPricingRuleCommand(supplierId, ruleId, user.id, dto),
    );
  }

  @Delete(':id/pricing-rules/:ruleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete pricing tier rule' })
  async deletePricingRule(
    @Param('id') supplierId: string,
    @Param('ruleId') ruleId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.commandBus.execute(
      new DeleteSupplierPricingRuleCommand(supplierId, ruleId, user.id),
    );
  }

  // Supplier Sync (Prom / Rozetka Pattern)
  @Get(':id/sync-settings')
  @ApiOperation({ summary: 'Get supplier feed sync settings' })
  async getSyncSettings(@Param('id') supplierId: string, @CurrentUser() user: { id: string }) {
    return this.queryBus.execute(new GetSupplierSyncSettingsQuery(supplierId, user.id));
  }

  @Patch(':id/sync-settings')
  @ApiOperation({ summary: 'Update supplier feed sync settings' })
  async updateSyncSettings(
    @Param('id') supplierId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateSupplierSyncSettingDto,
  ) {
    return this.commandBus.execute(new UpdateSupplierSyncSettingsCommand(supplierId, user.id, dto));
  }

  @Get(':id/sync-logs')
  @ApiOperation({ summary: 'Get supplier feed sync audit logs' })
  async getSyncLogs(
    @Param('id') supplierId: string,
    @CurrentUser() user: { id: string },
    @Query() query: GetSupplierSyncLogsQueryDto,
  ) {
    return this.queryBus.execute(
      new GetSupplierSyncLogsQuery(supplierId, user.id, query.limit || 50),
    );
  }

  @Delete(':id/sync-logs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear supplier feed sync logs' })
  async clearSyncLogs(@Param('id') supplierId: string, @CurrentUser() user: { id: string }) {
    return this.commandBus.execute(new ClearSupplierSyncLogsCommand(supplierId, user.id));
  }

  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger manual supplier feed sync' })
  async triggerSync(
    @Param('id') supplierId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: TriggerSupplierSyncDto,
  ) {
    return this.commandBus.execute(new SyncSupplierFeedCommand(supplierId, user.id, dto || {}));
  }
}
