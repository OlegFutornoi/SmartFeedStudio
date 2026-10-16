import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrencyCode, LiveBankRateDto } from '@smartfeed/shared';
import { CurrenciesService } from '@/modules/currencies/currencies.service';
import { GetLiveBankRatesQueryDto } from '@/modules/currencies/dto/get-live-bank-rates.dto';

@ApiTags('Currencies')
@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get('banks')
  @ApiOperation({ summary: 'Get live exchange rates for active Ukrainian banks' })
  @ApiQuery({ name: 'currency', required: false, enum: CurrencyCode, example: CurrencyCode.USD })
  @ApiResponse({ status: 200, description: 'List of live bank exchange rates' })
  async getLiveBankRates(@Query() query: GetLiveBankRatesQueryDto): Promise<LiveBankRateDto[]> {
    return this.currenciesService.getLiveBankRates(query.currency || CurrencyCode.USD);
  }
}
