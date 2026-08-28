import { useState, useEffect, useCallback } from 'react';
import {
  TariffPlanDto,
  CreateTariffPlanDto,
  UpdateTariffPlanDto,
  CreateTariffPlanDtoSchema,
} from '@smartfeed/shared';

interface UsePlanFormProps {
  initialData?: TariffPlanDto | null;
  isOpen: boolean;
  onSubmit: (dto: CreateTariffPlanDto | UpdateTariffPlanDto, isEdit: boolean) => Promise<void>;
  onClose: () => void;
}

export function usePlanForm({ initialData, isOpen, onSubmit, onClose }: UsePlanFormProps) {
  const isEdit = !!initialData;

  // Basic Info
  const [code, setCode] = useState('');
  const [nameUk, setNameUk] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descriptionUk, setDescriptionUk] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [priceMonthly, setPriceMonthly] = useState('0');
  const [priceYearly, setPriceYearly] = useState('');
  const [currency, setCurrency] = useState('UAH');
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState('1');

  // Quotas
  const [maxXmlLimit, setMaxXmlLimit] = useState('1000');
  const [maxSuppliersLimit, setMaxSuppliersLimit] = useState('1');
  const [maxFeedsLimit, setMaxFeedsLimit] = useState('1');
  const [maxChannelsLimit, setMaxChannelsLimit] = useState('1');
  const [maxTeamSeats, setMaxTeamSeats] = useState('1');
  const [maxStorageGb, setMaxStorageGb] = useState('0');
  const [aiCredits, setAiCredits] = useState('50');
  const [syncFrequencyHours, setSyncFrequencyHours] = useState('0');

  // Feature Flags
  const [canCloudBackup, setCanCloudBackup] = useState(false);
  const [hasApiAccess, setHasApiAccess] = useState(false);
  const [hasFeedDiff, setHasFeedDiff] = useState(false);
  const [hasWebhooks, setHasWebhooks] = useState(false);
  const [hasCustomS3, setHasCustomS3] = useState(false);
  const [hasAuditLog, setHasAuditLog] = useState(false);
  const [hasWhiteLabel, setHasWhiteLabel] = useState(false);
  const [hasPriorityAi, setHasPriorityAi] = useState(false);
  const [slaUptimePercent, setSlaUptimePercent] = useState('');

  // Bullet Features
  const [featuresUk, setFeaturesUk] = useState<string[]>([]);
  const [featuresEn, setFeaturesEn] = useState<string[]>([]);
  const [newFeatureUk, setNewFeatureUk] = useState('');
  const [newFeatureEn, setNewFeatureEn] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setNameUk(initialData.nameUk);
      setNameEn(initialData.nameEn);
      setDescriptionUk(initialData.descriptionUk || '');
      setDescriptionEn(initialData.descriptionEn || '');
      setPriceMonthly(initialData.priceMonthly.toString());
      setPriceYearly(initialData.priceYearly ? initialData.priceYearly.toString() : '');
      setCurrency(initialData.currency || 'UAH');
      setIsPopular(initialData.isPopular);
      setIsActive(initialData.isActive);
      setOrder(initialData.order.toString());

      setMaxXmlLimit(initialData.maxXmlLimit.toString());
      setMaxSuppliersLimit(initialData.maxSuppliersLimit.toString());
      setMaxFeedsLimit(initialData.maxFeedsLimit.toString());
      setMaxChannelsLimit(initialData.maxChannelsLimit.toString());
      setMaxTeamSeats(initialData.maxTeamSeats.toString());
      setMaxStorageGb(initialData.maxStorageGb.toString());
      setAiCredits(initialData.aiCredits.toString());
      setSyncFrequencyHours(initialData.syncFrequencyHours.toString());

      setCanCloudBackup(initialData.canCloudBackup);
      setHasApiAccess(initialData.hasApiAccess);
      setHasFeedDiff(initialData.hasFeedDiff);
      setHasWebhooks(initialData.hasWebhooks);
      setHasCustomS3(initialData.hasCustomS3);
      setHasAuditLog(initialData.hasAuditLog);
      setHasWhiteLabel(initialData.hasWhiteLabel);
      setHasPriorityAi(initialData.hasPriorityAi);
      setSlaUptimePercent(
        initialData.slaUptimePercent ? initialData.slaUptimePercent.toString() : '',
      );

      setFeaturesUk(initialData.featuresUk || []);
      setFeaturesEn(initialData.featuresEn || []);
    } else {
      setCode('');
      setNameUk('');
      setNameEn('');
      setDescriptionUk('');
      setDescriptionEn('');
      setPriceMonthly('0');
      setPriceYearly('');
      setCurrency('UAH');
      setIsPopular(false);
      setIsActive(true);
      setOrder('1');

      setMaxXmlLimit('1000');
      setMaxSuppliersLimit('1');
      setMaxFeedsLimit('1');
      setMaxChannelsLimit('1');
      setMaxTeamSeats('1');
      setMaxStorageGb('0');
      setAiCredits('50');
      setSyncFrequencyHours('0');

      setCanCloudBackup(false);
      setHasApiAccess(false);
      setHasFeedDiff(false);
      setHasWebhooks(false);
      setHasCustomS3(false);
      setHasAuditLog(false);
      setHasWhiteLabel(false);
      setHasPriorityAi(false);
      setSlaUptimePercent('');

      setFeaturesUk([]);
      setFeaturesEn([]);
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleAddFeature = useCallback(() => {
    if (newFeatureUk.trim() || newFeatureEn.trim()) {
      const ukText = newFeatureUk.trim() || newFeatureEn.trim();
      const enText = newFeatureEn.trim() || newFeatureUk.trim();
      setFeaturesUk((prev) => [...prev, ukText]);
      setFeaturesEn((prev) => [...prev, enText]);
      setNewFeatureUk('');
      setNewFeatureEn('');
    }
  }, [newFeatureUk, newFeatureEn]);

  const handleRemoveFeature = useCallback((index: number) => {
    setFeaturesUk((prev) => prev.filter((_, i) => i !== index));
    setFeaturesEn((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateFeature = useCallback((index: number, ukText: string, enText: string) => {
    setFeaturesUk((prev) => {
      const next = [...prev];
      next[index] = ukText;
      return next;
    });
    setFeaturesEn((prev) => {
      const next = [...prev];
      next[index] = enText;
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const payload = {
        code: code.trim().toUpperCase(),
        nameUk: nameUk.trim(),
        nameEn: nameEn.trim(),
        descriptionUk: descriptionUk.trim() || undefined,
        descriptionEn: descriptionEn.trim() || undefined,
        priceMonthly: parseFloat(priceMonthly) || 0,
        priceYearly: priceYearly.trim() ? parseFloat(priceYearly) : undefined,
        currency: currency.trim().toUpperCase() || 'UAH',
        isPopular,
        isActive,
        order: parseInt(order, 10) || 0,

        maxXmlLimit: parseInt(maxXmlLimit, 10) || 1000,
        maxSuppliersLimit: parseInt(maxSuppliersLimit, 10) || 1,
        maxFeedsLimit: parseInt(maxFeedsLimit, 10) || 1,
        maxChannelsLimit: parseInt(maxChannelsLimit, 10) || 1,
        maxTeamSeats: parseInt(maxTeamSeats, 10) || 1,
        maxStorageGb: parseInt(maxStorageGb, 10) || 0,
        aiCredits: parseInt(aiCredits, 10) || 0,
        syncFrequencyHours: parseInt(syncFrequencyHours, 10) || 0,

        canCloudBackup,
        hasApiAccess,
        hasFeedDiff,
        hasWebhooks,
        hasCustomS3,
        hasAuditLog,
        hasWhiteLabel,
        hasPriorityAi,
        slaUptimePercent: slaUptimePercent.trim() ? parseFloat(slaUptimePercent) : undefined,

        featuresUk,
        featuresEn,
      };

      let submitPayload: CreateTariffPlanDto | UpdateTariffPlanDto = payload;

      if (!isEdit) {
        const validation = CreateTariffPlanDtoSchema.safeParse(payload);
        if (!validation.success) {
          setError(
            validation.error.issues[0]?.message || 'Перевірте правильність заповнення полів',
          );
          return;
        }
        submitPayload = validation.data;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(submitPayload, isEdit);
        onClose();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Помилка збереження тарифного плану';
        setError(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      code,
      nameUk,
      nameEn,
      descriptionUk,
      descriptionEn,
      priceMonthly,
      priceYearly,
      currency,
      isPopular,
      isActive,
      order,
      maxXmlLimit,
      maxSuppliersLimit,
      maxFeedsLimit,
      maxChannelsLimit,
      maxTeamSeats,
      maxStorageGb,
      aiCredits,
      syncFrequencyHours,
      canCloudBackup,
      hasApiAccess,
      hasFeedDiff,
      hasWebhooks,
      hasCustomS3,
      hasAuditLog,
      hasWhiteLabel,
      hasPriorityAi,
      slaUptimePercent,
      featuresUk,
      featuresEn,
      isEdit,
      onSubmit,
      onClose,
    ],
  );

  return {
    isEdit,
    // Basic
    code,
    setCode,
    nameUk,
    setNameUk,
    nameEn,
    setNameEn,
    descriptionUk,
    setDescriptionUk,
    descriptionEn,
    setDescriptionEn,
    priceMonthly,
    setPriceMonthly,
    priceYearly,
    setPriceYearly,
    currency,
    setCurrency,
    isPopular,
    setIsPopular,
    isActive,
    setIsActive,
    order,
    setOrder,
    // Quotas
    maxXmlLimit,
    setMaxXmlLimit,
    maxSuppliersLimit,
    setMaxSuppliersLimit,
    maxFeedsLimit,
    setMaxFeedsLimit,
    maxChannelsLimit,
    setMaxChannelsLimit,
    maxTeamSeats,
    setMaxTeamSeats,
    maxStorageGb,
    setMaxStorageGb,
    aiCredits,
    setAiCredits,
    syncFrequencyHours,
    setSyncFrequencyHours,
    // Feature flags
    canCloudBackup,
    setCanCloudBackup,
    hasApiAccess,
    setHasApiAccess,
    hasFeedDiff,
    setHasFeedDiff,
    hasWebhooks,
    setHasWebhooks,
    hasCustomS3,
    setHasCustomS3,
    hasAuditLog,
    setHasAuditLog,
    hasWhiteLabel,
    setHasWhiteLabel,
    hasPriorityAi,
    setHasPriorityAi,
    slaUptimePercent,
    setSlaUptimePercent,
    // Bullets
    featuresUk,
    featuresEn,
    newFeatureUk,
    setNewFeatureUk,
    newFeatureEn,
    setNewFeatureEn,
    // Status
    isSubmitting,
    error,
    handleAddFeature,
    handleUpdateFeature,
    handleRemoveFeature,
    handleSubmit,
  };
}
