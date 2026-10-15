import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisCacheService } from '@/common/cache/redis-cache.service';
import { LiveBankRateDto, BankProviderConfigDto, CurrencyCode } from '@smartfeed/shared';
import { UpdateBankProviderDto } from '@/modules/currencies/dto/update-bank-provider.dto';

interface NbuRateResponse {
  r030: number;
  txt: string;
  rate: number;
  cc: string;
  exchangedate: string;
}

@Injectable()
export class CurrenciesService {
  private readonly logger = new Logger(CurrenciesService.name);
  private static readonly CACHE_TTL_SECONDS = 300; // 5 minutes
  private static readonly FALLBACK_RATES: Record<string, number> = {
    USD: 41.5,
    EUR: 45.2,
    PLN: 10.6,
    GBP: 53.8,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  async getLiveBankRates(currency: CurrencyCode = CurrencyCode.USD): Promise<LiveBankRateDto[]> {
    const cacheKey = `currencies:live:${currency}`;

    const cached = await this.cache.get<LiveBankRateDto[]>(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    const nbuRate = await this.fetchNbuRate(currency);
    const providers = await this.prisma.bankCurrencyProvider.findMany({
      where: { isEnabled: true },
      orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }],
    });

    const rates: LiveBankRateDto[] = providers.map((provider) => {
      const isNbu = provider.bankId === 'nbu';
      const buySpread = Number(provider.buySpreadPercent);
      const sellSpread = Number(provider.sellSpreadPercent);

      const buyRate = isNbu ? nbuRate : Number((nbuRate * (1 + buySpread / 100)).toFixed(2));
      const sellRate = isNbu ? nbuRate : Number((nbuRate * (1 + sellSpread / 100)).toFixed(2));
      const deltaNbu = Number((sellRate - nbuRate).toFixed(2));
      const deltaPercent = nbuRate > 0 ? Number(((deltaNbu / nbuRate) * 100).toFixed(2)) : 0;

      return {
        bankId: provider.bankId,
        bankName: provider.bankName,
        badge: provider.badge,
        logoUrl: provider.logoUrl,
        currency,
        buyRate,
        sellRate,
        deltaNbu,
        deltaPercent,
        updatedAt: provider.updatedAt.toISOString(),
        isDefault: provider.isDefault,
      };
    });

    await this.cache.set(cacheKey, rates, CurrenciesService.CACHE_TTL_SECONDS);
    return rates;
  }

  async getAllProviders(): Promise<BankProviderConfigDto[]> {
    const records = await this.prisma.bankCurrencyProvider.findMany({
      orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }],
    });

    return records.map((r) => ({
      id: r.id,
      bankId: r.bankId,
      bankName: r.bankName,
      badge: r.badge,
      logoUrl: r.logoUrl,
      isEnabled: r.isEnabled,
      isDefault: r.isDefault,
      sourceType: r.sourceType as 'API_DIRECT' | 'COMMERCIAL_SPREAD' | 'MANUAL',
      sellSpreadPercent: Number(r.sellSpreadPercent),
      buySpreadPercent: Number(r.buySpreadPercent),
      sortOrder: r.sortOrder,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async updateProvider(id: string, dto: UpdateBankProviderDto): Promise<BankProviderConfigDto> {
    const existing = await this.prisma.bankCurrencyProvider.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Bank provider with ID "${id}" was not found`);
    }

    if (dto.isDefault) {
      await this.prisma.bankCurrencyProvider.updateMany({
        where: { id: { not: id }, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.bankCurrencyProvider.update({
      where: { id },
      data: {
        ...(dto.bankName !== undefined && { bankName: dto.bankName }),
        ...(dto.badge !== undefined && { badge: dto.badge }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.isEnabled !== undefined && { isEnabled: dto.isEnabled }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.sourceType !== undefined && { sourceType: dto.sourceType }),
        ...(dto.buySpreadPercent !== undefined && { buySpreadPercent: dto.buySpreadPercent }),
        ...(dto.sellSpreadPercent !== undefined && { sellSpreadPercent: dto.sellSpreadPercent }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });

    await this.invalidateRatesCache();

    return {
      id: updated.id,
      bankId: updated.bankId,
      bankName: updated.bankName,
      badge: updated.badge,
      logoUrl: updated.logoUrl,
      isEnabled: updated.isEnabled,
      isDefault: updated.isDefault,
      sourceType: updated.sourceType as 'API_DIRECT' | 'COMMERCIAL_SPREAD' | 'MANUAL',
      sellSpreadPercent: Number(updated.sellSpreadPercent),
      buySpreadPercent: Number(updated.buySpreadPercent),
      sortOrder: updated.sortOrder,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async syncRates(): Promise<{ synced: boolean; timestamp: string }> {
    await this.invalidateRatesCache();
    await this.getLiveBankRates(CurrencyCode.USD);
    await this.getLiveBankRates(CurrencyCode.EUR);

    return {
      synced: true,
      timestamp: new Date().toISOString(),
    };
  }

  private async fetchNbuRate(currency: CurrencyCode): Promise<number> {
    const url = `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=${encodeURIComponent(currency)}&json`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) {
        throw new Error(`NBU API responded with status ${response.status}`);
      }
      const data = (await response.json()) as NbuRateResponse[];
      if (Array.isArray(data) && data[0]?.rate) {
        return Number(data[0].rate.toFixed(2));
      }
      throw new Error(`Invalid payload structure from NBU API for ${currency}`);
    } catch (err) {
      this.logger.warn(
        `[CurrenciesService] Failed to fetch NBU rate for ${currency}: ${err}. Using fallback rate.`,
      );
      return CurrenciesService.FALLBACK_RATES[currency] || 41.5;
    }
  }

  private async invalidateRatesCache(): Promise<void> {
    const currencies = [CurrencyCode.USD, CurrencyCode.EUR, CurrencyCode.PLN, CurrencyCode.GBP];
    await Promise.all(currencies.map((c) => this.cache.del(`currencies:live:${c}`)));
  }
}
