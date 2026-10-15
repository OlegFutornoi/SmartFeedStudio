import { Controller, Get, Patch, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role, BankProviderConfigDto } from '@smartfeed/shared';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CurrenciesService } from '@/modules/currencies/currencies.service';
import { UpdateBankProviderDto } from '@/modules/currencies/dto/update-bank-provider.dto';

@ApiTags('Admin Currencies')
@Controller('admin/currencies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@ApiBearerAuth()
export class AdminCurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get('providers')
  @ApiOperation({ summary: 'List all configured bank currency providers' })
  @ApiResponse({ status: 200, description: 'List of bank providers' })
  async getAllProviders(): Promise<BankProviderConfigDto[]> {
    return this.currenciesService.getAllProviders();
  }

  @Patch('providers/:id')
  @ApiOperation({
    summary: 'Update bank provider configuration (spreads, enabled status, default)',
  })
  @ApiResponse({ status: 200, description: 'Updated bank provider configuration' })
  async updateProvider(
    @Param('id') id: string,
    @Body() dto: UpdateBankProviderDto,
  ): Promise<BankProviderConfigDto> {
    return this.currenciesService.updateProvider(id, dto);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Force sync live rates from NBU and invalidate cache' })
  @ApiResponse({ status: 200, description: 'Rates synchronized successfully' })
  async syncRates(): Promise<{ synced: boolean; timestamp: string }> {
    return this.currenciesService.syncRates();
  }
}
