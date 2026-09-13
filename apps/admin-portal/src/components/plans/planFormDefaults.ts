import {
  TariffPlanDto,
  CreateTariffPlanDto,
  UpdateTariffPlanDto,
  CreateTariffPlanDtoSchema,
} from '@smartfeed/shared';

export interface PlanFormFields {
  code: string;
  nameUk: string;
  nameEn: string;
  descriptionUk: string;
  descriptionEn: string;
  priceMonthly: string;
  priceYearly: string;
  currency: string;
  isPopular: boolean;
  isActive: boolean;
  order: string;

  maxXmlLimit: string;
  maxSuppliersLimit: string;
  maxFeedsLimit: string;
  maxChannelsLimit: string;
  maxTeamSeats: string;
  maxStorageGb: string;
  aiCredits: string;
  syncFrequencyHours: string;

  canCloudBackup: boolean;
  hasApiAccess: boolean;
  hasFeedDiff: boolean;
  hasWebhooks: boolean;
  hasCustomS3: boolean;
  hasAuditLog: boolean;
  hasWhiteLabel: boolean;
  hasPriorityAi: boolean;
  slaUptimePercent: string;

  featuresUk: string[];
  featuresEn: string[];
}

export function getDefaultPlanFormFields(initialData?: TariffPlanDto | null): PlanFormFields {
  if (initialData) {
    return {
      code: initialData.code,
      nameUk: initialData.nameUk,
      nameEn: initialData.nameEn,
      descriptionUk: initialData.descriptionUk || '',
      descriptionEn: initialData.descriptionEn || '',
      priceMonthly: initialData.priceMonthly.toString(),
      priceYearly: initialData.priceYearly ? initialData.priceYearly.toString() : '',
      currency: initialData.currency || 'UAH',
      isPopular: initialData.isPopular,
      isActive: initialData.isActive,
      order: initialData.order.toString(),

      maxXmlLimit: initialData.maxXmlLimit.toString(),
      maxSuppliersLimit: initialData.maxSuppliersLimit.toString(),
      maxFeedsLimit: initialData.maxFeedsLimit.toString(),
      maxChannelsLimit: initialData.maxChannelsLimit.toString(),
      maxTeamSeats: initialData.maxTeamSeats.toString(),
      maxStorageGb: initialData.maxStorageGb.toString(),
      aiCredits: initialData.aiCredits.toString(),
      syncFrequencyHours: initialData.syncFrequencyHours.toString(),

      canCloudBackup: initialData.canCloudBackup,
      hasApiAccess: initialData.hasApiAccess,
      hasFeedDiff: initialData.hasFeedDiff,
      hasWebhooks: initialData.hasWebhooks,
      hasCustomS3: initialData.hasCustomS3,
      hasAuditLog: initialData.hasAuditLog,
      hasWhiteLabel: initialData.hasWhiteLabel,
      hasPriorityAi: initialData.hasPriorityAi,
      slaUptimePercent: initialData.slaUptimePercent ? initialData.slaUptimePercent.toString() : '',

      featuresUk: initialData.featuresUk || [],
      featuresEn: initialData.featuresEn || [],
    };
  }

  return {
    code: '',
    nameUk: '',
    nameEn: '',
    descriptionUk: '',
    descriptionEn: '',
    priceMonthly: '0',
    priceYearly: '',
    currency: 'UAH',
    isPopular: false,
    isActive: true,
    order: '1',

    maxXmlLimit: '1000',
    maxSuppliersLimit: '1',
    maxFeedsLimit: '1',
    maxChannelsLimit: '1',
    maxTeamSeats: '1',
    maxStorageGb: '0',
    aiCredits: '50',
    syncFrequencyHours: '0',

    canCloudBackup: false,
    hasApiAccess: false,
    hasFeedDiff: false,
    hasWebhooks: false,
    hasCustomS3: false,
    hasAuditLog: false,
    hasWhiteLabel: false,
    hasPriorityAi: false,
    slaUptimePercent: '',

    featuresUk: [],
    featuresEn: [],
  };
}

export function buildPlanSubmitPayload(
  fields: PlanFormFields,
  isEdit: boolean,
): {
  payload?: CreateTariffPlanDto | UpdateTariffPlanDto;
  error?: string;
} {
  const rawPayload = {
    code: fields.code.trim().toUpperCase(),
    nameUk: fields.nameUk.trim(),
    nameEn: fields.nameEn.trim(),
    descriptionUk: fields.descriptionUk.trim() || undefined,
    descriptionEn: fields.descriptionEn.trim() || undefined,
    priceMonthly: parseFloat(fields.priceMonthly) || 0,
    priceYearly: fields.priceYearly.trim() ? parseFloat(fields.priceYearly) : undefined,
    currency: fields.currency.trim().toUpperCase() || 'UAH',
    isPopular: fields.isPopular,
    isActive: fields.isActive,
    order: parseInt(fields.order, 10) || 0,

    maxXmlLimit: parseInt(fields.maxXmlLimit, 10) || 1000,
    maxSuppliersLimit: parseInt(fields.maxSuppliersLimit, 10) || 1,
    maxFeedsLimit: parseInt(fields.maxFeedsLimit, 10) || 1,
    maxChannelsLimit: parseInt(fields.maxChannelsLimit, 10) || 1,
    maxTeamSeats: parseInt(fields.maxTeamSeats, 10) || 1,
    maxStorageGb: parseInt(fields.maxStorageGb, 10) || 0,
    aiCredits: parseInt(fields.aiCredits, 10) || 0,
    syncFrequencyHours: parseInt(fields.syncFrequencyHours, 10) || 0,

    canCloudBackup: fields.canCloudBackup,
    hasApiAccess: fields.hasApiAccess,
    hasFeedDiff: fields.hasFeedDiff,
    hasWebhooks: fields.hasWebhooks,
    hasCustomS3: fields.hasCustomS3,
    hasAuditLog: fields.hasAuditLog,
    hasWhiteLabel: fields.hasWhiteLabel,
    hasPriorityAi: fields.hasPriorityAi,
    slaUptimePercent: fields.slaUptimePercent.trim()
      ? parseFloat(fields.slaUptimePercent)
      : undefined,

    featuresUk: fields.featuresUk,
    featuresEn: fields.featuresEn,
  };

  if (!isEdit) {
    const validation = CreateTariffPlanDtoSchema.safeParse(rawPayload);
    if (!validation.success) {
      return {
        error: validation.error.issues[0]?.message || 'Перевірте правильність заповнення полів',
      };
    }
    return { payload: validation.data };
  }

  return { payload: rawPayload };
}
