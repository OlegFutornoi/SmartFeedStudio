import type {
  ExportChannelDto,
  CreateExportChannelDto,
  UpdateExportChannelDto,
  ExportChannelPricingRuleDto,
  CreateExportChannelPricingRuleDto,
  PriceSimulationRequestDto,
  PriceSimulationResultDto,
} from '@smartfeed/shared';
import { localDb } from '@/services/local-db';
import { ApiError } from '@/lib/api/client';

export async function getExportChannels(
  _params?: { search?: string; isActive?: boolean },
  _token?: string,
): Promise<ExportChannelDto[]> {
  return localDb.export.getExportChannels();
}

export async function getExportChannelById(
  id: string,
  _token?: string,
): Promise<ExportChannelDto & { pricingRules: ExportChannelPricingRuleDto[] }> {
  const channel = await localDb.export.getExportChannelById(id);
  if (!channel) throw new ApiError('Export channel not found', 404);
  const pricingRules = await localDb.export.getExportPricingRules(id);
  return { ...channel, pricingRules };
}

export async function createExportChannel(
  dto: CreateExportChannelDto,
  _token?: string,
): Promise<ExportChannelDto> {
  return localDb.export.createExportChannel(dto);
}

export async function updateExportChannel(
  id: string,
  dto: UpdateExportChannelDto,
  _token?: string,
): Promise<ExportChannelDto> {
  return localDb.export.updateExportChannel(id, dto);
}

export async function deleteExportChannel(
  id: string,
  _token?: string,
): Promise<{ success: boolean }> {
  const success = await localDb.export.deleteExportChannel(id);
  return { success };
}

export async function createExportChannelRule(
  channelId: string,
  dto: CreateExportChannelPricingRuleDto,
  _token?: string,
): Promise<ExportChannelPricingRuleDto> {
  return localDb.export.createExportPricingRule(channelId, dto);
}

export async function deleteExportChannelRule(
  channelId: string,
  ruleId: string,
  _token?: string,
): Promise<{ success: boolean }> {
  const success = await localDb.export.deleteExportPricingRule(channelId, ruleId);
  return { success };
}

export async function simulatePricing(
  dto: PriceSimulationRequestDto,
): Promise<PriceSimulationResultDto> {
  return localDb.export.simulatePrice(dto);
}
