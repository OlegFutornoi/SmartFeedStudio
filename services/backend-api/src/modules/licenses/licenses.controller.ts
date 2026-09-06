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
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  AdminLicenseItemDto,
  LicenseEntity,
  PlanType,
  Role,
  UserQuotasDto,
} from '@smartfeed/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GetLicenseByUserIdQuery } from './queries/get-license-by-user-id.query';
import { GetAdminLicensesQuery } from './queries/get-admin-licenses.query';
import { GetUsageQuotasQuery } from './queries/get-usage-quotas.query';
import { CreateLicenseCommand } from './commands/create-license.command';
import { SelectTariffPlanCommand } from './commands/select-tariff-plan.command';
import { UpdateLicenseStatusCommand } from './commands/update-license-status.command';
import { DeleteLicenseCommand } from './commands/delete-license.command';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SelectPlanDto {
  @IsString()
  @IsNotEmpty()
  planCode: string;

  @IsOptional()
  @IsString()
  billingInterval?: 'monthly' | 'yearly';
}

export class UpgradeLicenseDto {
  @IsEnum(PlanType)
  planType: PlanType;
}

export class AssignLicenseDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(PlanType)
  planType: PlanType;
}

export class UpdateLicenseStatusDto {
  @IsBoolean()
  isActive: boolean;
}

@ApiTags('Licenses')
@Controller('licenses')
export class LicensesController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user active license details' })
  @ApiResponse({ status: 200, description: 'License details returned' })
  @ApiResponse({ status: 404, description: 'No active license found' })
  async getMyLicense(@CurrentUser('id') userId: string): Promise<LicenseEntity> {
    const license = await this.queryBus.execute(new GetLicenseByUserIdQuery(userId));
    if (!license) {
      throw new NotFoundException('No active license found for this user');
    }
    return license;
  }

  @Get('quotas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user real-time usage quotas and plan limits' })
  @ApiResponse({ status: 200, description: 'User quotas and usage counters returned' })
  async getQuotas(@CurrentUser('id') userId: string): Promise<UserQuotasDto> {
    return this.queryBus.execute(new GetUsageQuotasQuery(userId));
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all user licenses for admin management' })
  @ApiQuery({ name: 'search', required: false, description: 'Filter by email or license key' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of user licenses' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAdminLicenses(
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<AdminLicenseItemDto[]> {
    return this.queryBus.execute(
      new GetAdminLicensesQuery(search, limit ? Number(limit) : 50, offset ? Number(offset) : 0),
    );
  }

  @Post('select-plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Select or renew tariff plan for current user' })
  @ApiResponse({ status: 201, description: 'Plan selected and license updated' })
  async selectPlan(
    @CurrentUser('id') userId: string,
    @Body() dto: SelectPlanDto,
  ): Promise<LicenseEntity> {
    return this.commandBus.execute(
      new SelectTariffPlanCommand(userId, dto.planCode, dto.billingInterval || 'monthly'),
    );
  }

  @Post('upgrade')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade user subscription plan' })
  async upgradePlan(
    @CurrentUser('id') userId: string,
    @Body() dto: UpgradeLicenseDto,
  ): Promise<LicenseEntity> {
    return this.commandBus.execute(new CreateLicenseCommand(userId, dto.planType));
  }

  @Post('assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign a license/plan to a specific user (Admin only)' })
  async assignLicense(@Body() dto: AssignLicenseDto): Promise<LicenseEntity> {
    return this.commandBus.execute(new CreateLicenseCommand(dto.userId, dto.planType));
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update license active/suspended status (Admin only)' })
  @ApiResponse({ status: 200, description: 'License status updated' })
  @ApiResponse({ status: 404, description: 'License not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLicenseStatusDto,
  ): Promise<LicenseEntity> {
    return this.commandBus.execute(new UpdateLicenseStatusCommand(id, dto.isActive));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a license by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'License deleted' })
  @ApiResponse({ status: 404, description: 'License not found' })
  async deleteLicense(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.commandBus.execute(new DeleteLicenseCommand(id));
  }
}
