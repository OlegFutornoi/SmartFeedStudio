import type {
  ExportChannelDto,
  CreateExportChannelDto,
  UpdateExportChannelDto,
  ExportChannelPricingRuleDto,
  CreateExportChannelPricingRuleDto,
  PriceSimulationRequestDto,
  PriceSimulationResultDto,
} from '@smartfeed/shared';
import { FeedFormat } from '@smartfeed/shared';
import type { MockDbState } from './mock-state';

export function getExportChannels(state: MockDbState): ExportChannelDto[] {
  return [...state.exportChannels];
}

export function getExportChannelById(state: MockDbState, id: string): ExportChannelDto | null {
  return state.exportChannels.find((c) => c.id === id) || null;
}

export function createExportChannel(
  state: MockDbState,
  payload: CreateExportChannelDto,
): ExportChannelDto {
  const slug = payload.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const newChannel: ExportChannelDto = {
    id: `chan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: 'usr_admin',
    name: payload.name.trim(),
    marketplaceCode: payload.marketplaceCode || 'ROZETKA',
    feedFormat: payload.feedFormat || FeedFormat.XML_ROZETKA,
    slug,
    exportUrl: `http://localhost:1420/export/${slug}.xml`,
    commissionPercent: payload.commissionPercent ?? 10,
    extraFixedCost: payload.extraFixedCost ?? 0,
    applyReverseMarkup: payload.applyReverseMarkup ?? true,
    isActive: payload.isActive ?? true,
    pricingRulesCount: 0,
    totalProductsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  state.exportChannels.unshift(newChannel);
  return newChannel;
}

export function updateExportChannel(
  state: MockDbState,
  id: string,
  payload: UpdateExportChannelDto,
): ExportChannelDto {
  const index = state.exportChannels.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error('Канал експорту не знайдено');
  }

  const updated = {
    ...state.exportChannels[index],
    ...payload,
    updatedAt: new Date().toISOString(),
  };
  state.exportChannels[index] = updated;
  return updated;
}

export function deleteExportChannel(state: MockDbState, id: string): boolean {
  const initialLen = state.exportChannels.length;
  state.exportChannels = state.exportChannels.filter((c) => c.id !== id);
  state.exportPricingRules.delete(id);
  return state.exportChannels.length < initialLen;
}

export function getExportPricingRules(
  state: MockDbState,
  channelId: string,
): ExportChannelPricingRuleDto[] {
  return state.exportPricingRules.get(channelId) || [];
}

export function createExportPricingRule(
  state: MockDbState,
  channelId: string,
  payload: CreateExportChannelPricingRuleDto,
): ExportChannelPricingRuleDto {
  const list = state.exportPricingRules.get(channelId) || [];
  const newRule: ExportChannelPricingRuleDto = {
    id: `exp_rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    exportChannelId: channelId,
    categoryId: payload.categoryId || null,
    commissionPercent:
      payload.commissionPercent !== undefined ? Number(payload.commissionPercent) : null,
    marginPercent: payload.marginPercent !== undefined ? Number(payload.marginPercent) : null,
    fixedMarkup: payload.fixedMarkup !== undefined ? Number(payload.fixedMarkup) : null,
    priority: payload.priority || 0,
    isActive: payload.isActive ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  list.unshift(newRule);
  state.exportPricingRules.set(channelId, list);

  // Update rules count on channel
  const chan = state.exportChannels.find((c) => c.id === channelId);
  if (chan) {
    chan.pricingRulesCount = list.length;
  }

  return newRule;
}

export function deleteExportPricingRule(
  state: MockDbState,
  channelId: string,
  ruleId: string,
): boolean {
  const list = state.exportPricingRules.get(channelId) || [];
  const filtered = list.filter((r) => r.id !== ruleId);
  state.exportPricingRules.set(channelId, filtered);

  const chan = state.exportChannels.find((c) => c.id === channelId);
  if (chan) {
    chan.pricingRulesCount = filtered.length;
  }

  return filtered.length < list.length;
}

export function simulatePrice(payload: PriceSimulationRequestDto): PriceSimulationResultDto {
  const costPrice = Number(payload.costPrice || 0);
  const supplierMargin = Number(payload.supplierMarginPercent || 0) / 100;
  const supplierFixed = Number(payload.supplierFixedMarkup || 0);
  const commissionPercent = Number(payload.marketplaceCommissionPercent || 15) / 100;
  const extraFixed = Number(payload.marketplaceExtraFixedCost || 0);

  const basePrice = Math.round((costPrice * (1 + supplierMargin) + supplierFixed) * 100) / 100;
  const supplierMarkupProfit = Math.round((basePrice - costPrice) * 100) / 100;

  let shelfPrice = basePrice;
  if (payload.applyReverseMarkup && commissionPercent < 1) {
    shelfPrice = Math.round(((basePrice + extraFixed) / (1 - commissionPercent)) * 100) / 100;
  } else {
    shelfPrice = Math.round((basePrice * (1 + commissionPercent) + extraFixed) * 100) / 100;
  }

  const commissionAmount = Math.round(shelfPrice * commissionPercent * 100) / 100;
  const payoutAmount = Math.round((shelfPrice - commissionAmount - extraFixed) * 100) / 100;
  const netProfit = Math.round((payoutAmount - costPrice) * 100) / 100;
  const netMarginPercent = costPrice > 0 ? Math.round((netProfit / costPrice) * 1000) / 10 : 0;
  const returnOnSalesPercent =
    shelfPrice > 0 ? Math.round((netProfit / shelfPrice) * 1000) / 10 : 0;

  return {
    costPrice,
    basePrice,
    supplierMarkupProfit,
    shelfPrice,
    commissionAmount,
    extraFixedCost: extraFixed,
    payoutAmount,
    netProfit,
    netMarginPercent,
    returnOnSalesPercent,
  };
}
