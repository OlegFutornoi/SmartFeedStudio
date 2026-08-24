import { Controller, Get, Post, Body, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AdminLicenseItemDto, LicenseEntity, PlanType, Role } from '@smartfeed/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GetLicenseByUserIdQuery } from './queries/get-license-by-user-id.query';
import { GetAdminLicensesQuery } from './queries/get-admin-licenses.query';
import { CreateLicenseCommand } from './commands/create-license.command';

class UpgradeLicenseDto {
  planType: PlanType;
}

class AssignLicenseDto {
  userId: string;
  planType: PlanType;
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
}
