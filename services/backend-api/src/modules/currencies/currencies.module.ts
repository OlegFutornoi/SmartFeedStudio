import { Module } from '@nestjs/common';
import { CurrenciesService } from '@/modules/currencies/currencies.service';
import { CurrenciesController } from '@/modules/currencies/currencies.controller';
import { AdminCurrenciesController } from '@/modules/currencies/admin-currencies.controller';
import { RedisCacheModule } from '@/common/cache/redis-cache.module';

@Module({
  imports: [RedisCacheModule],
  controllers: [CurrenciesController, AdminCurrenciesController],
  providers: [CurrenciesService],
  exports: [CurrenciesService],
})
export class CurrenciesModule {}
