import type {
  ExportChannelDto,
  CreateExportChannelDto,
  UpdateExportChannelDto,
  ExportChannelPricingRuleDto,
  CreateExportChannelPricingRuleDto,
  PriceSimulationRequestDto,
  PriceSimulationResultDto,
} from '@smartfeed/shared';
import { invokeLocalDb } from '@/services/local-db/client';

export class LocalExportService {
  async getExportChannels(): Promise<ExportChannelDto[]> {
    return invokeLocalDb('db_get_export_channels', {});
  }

  async getExportChannelById(id: string): Promise<ExportChannelDto | null> {
    return invokeLocalDb('db_get_export_channel_by_id', { id });
  }

  async createExportChannel(payload: CreateExportChannelDto): Promise<ExportChannelDto> {
    return invokeLocalDb('db_create_export_channel', { payload });
  }

  async updateExportChannel(
    id: string,
    payload: UpdateExportChannelDto,
  ): Promise<ExportChannelDto> {
    return invokeLocalDb('db_update_export_channel', { id, payload });
  }

  async deleteExportChannel(id: string): Promise<boolean> {
    return invokeLocalDb('db_delete_export_channel', { id });
  }

  async getExportPricingRules(channelId: string): Promise<ExportChannelPricingRuleDto[]> {
    return invokeLocalDb('db_get_export_pricing_rules', { channelId });
  }

  async createExportPricingRule(
    channelId: string,
    payload: CreateExportChannelPricingRuleDto,
  ): Promise<ExportChannelPricingRuleDto> {
    return invokeLocalDb('db_create_export_pricing_rule', { channelId, payload });
  }

  async deleteExportPricingRule(channelId: string, ruleId: string): Promise<boolean> {
    return invokeLocalDb('db_delete_export_pricing_rule', { channelId, ruleId });
  }

  async simulatePrice(payload: PriceSimulationRequestDto): Promise<PriceSimulationResultDto> {
    return invokeLocalDb('db_simulate_price', { payload });
  }
}

export const localExportService = new LocalExportService();
