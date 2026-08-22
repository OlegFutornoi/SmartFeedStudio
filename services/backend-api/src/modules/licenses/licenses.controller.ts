import { Controller, Get, Post, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GetLicenseByUserIdQuery } from './queries/get-license-by-user-id.query';
import { CreateLicenseCommand } from './commands/create-license.command';
import { LicenseEntity, PlanType } from '@smartfeed/shared';

class UpgradeLicenseDto {
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
}
