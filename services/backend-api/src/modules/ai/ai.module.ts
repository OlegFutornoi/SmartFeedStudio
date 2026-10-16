import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PerplexityAgentService } from '@/modules/ai/perplexity-agent.service';

@Module({
  imports: [ConfigModule],
  providers: [PerplexityAgentService],
  exports: [PerplexityAgentService],
})
export class AiModule {}
