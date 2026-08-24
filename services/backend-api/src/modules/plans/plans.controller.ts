import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Role, TariffPlanDto } from '@smartfeed/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateTariffPlanDto } from './dto/create-tariff-plan.dto';
import { UpdateTariffPlanDto } from './dto/update-tariff-plan.dto';
import { CreateTariffPlanCommand } from './commands/create-tariff-plan.command';
import { UpdateTariffPlanCommand } from './commands/update-tariff-plan.command';
import { DeleteTariffPlanCommand } from './commands/delete-tariff-plan.command';
import { GetTariffPlansQuery } from './queries/get-tariff-plans.query';
import { GetAllTariffPlansAdminQuery } from './queries/get-all-tariff-plans-admin.query';
import { GetTariffPlanByIdQuery } from './queries/get-tariff-plan-by-id.query';

@ApiTags('Tariff Plans')
@Controller('plans')
export class PlansController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all active tariff plans for pricing display and subscription' })
  @ApiResponse({ status: 200, description: 'List of active tariff plans' })
  async getActivePlans(): Promise<TariffPlanDto[]> {
    return this.queryBus.execute(new GetTariffPlansQuery());
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all tariff plans including inactive (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all tariff plans' })
  @ApiResponse({ status: 403, description: 'Forbidden resource' })
  async getAllForAdmin(): Promise<TariffPlanDto[]> {
    return this.queryBus.execute(new GetAllTariffPlansAdminQuery());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single tariff plan by ID' })
  @ApiResponse({ status: 200, description: 'Tariff plan details' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlanById(@Param('id') id: string): Promise<TariffPlanDto> {
    return this.queryBus.execute(new GetTariffPlanByIdQuery(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new tariff plan with custom quotas and features (Admin only)',
  })
  @ApiResponse({ status: 201, description: 'Tariff plan created successfully' })
  @ApiResponse({ status: 409, description: 'Tariff plan code already exists' })
  async createPlan(@Body() dto: CreateTariffPlanDto): Promise<TariffPlanDto> {
    return this.commandBus.execute(new CreateTariffPlanCommand(dto));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a tariff plan by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Tariff plan updated successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateTariffPlanDto,
  ): Promise<TariffPlanDto> {
    return this.commandBus.execute(new UpdateTariffPlanCommand(id, dto));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a tariff plan by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Tariff plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async deletePlan(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteTariffPlanCommand(id));
  }
}
