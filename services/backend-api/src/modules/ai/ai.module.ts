import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PerplexityAgentService } from '@/modules/ai/perplexity-agent.service';
import { LlmGatewayService } from '@/modules/ai/llm-gateway.service';

@Module({
  imports: [ConfigModule],
  providers: [PerplexityAgentService, LlmGatewayService],
  exports: [PerplexityAgentService, LlmGatewayService],
})
export class AiModule {}
