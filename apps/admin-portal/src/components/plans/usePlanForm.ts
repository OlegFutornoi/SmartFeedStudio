import { useState, useEffect, useCallback } from 'react';
import type { TariffPlanDto, CreateTariffPlanDto, UpdateTariffPlanDto } from '@smartfeed/shared';
import {
  getDefaultPlanFormFields,
  buildPlanSubmitPayload,
} from '@/components/plans/planFormDefaults';

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
    const defaults = getDefaultPlanFormFields(initialData);
    setCode(defaults.code);
    setNameUk(defaults.nameUk);
    setNameEn(defaults.nameEn);
    setDescriptionUk(defaults.descriptionUk);
    setDescriptionEn(defaults.descriptionEn);
    setPriceMonthly(defaults.priceMonthly);
    setPriceYearly(defaults.priceYearly);
    setCurrency(defaults.currency);
    setIsPopular(defaults.isPopular);
    setIsActive(defaults.isActive);
    setOrder(defaults.order);

    setMaxXmlLimit(defaults.maxXmlLimit);
    setMaxSuppliersLimit(defaults.maxSuppliersLimit);
    setMaxFeedsLimit(defaults.maxFeedsLimit);
    setMaxChannelsLimit(defaults.maxChannelsLimit);
    setMaxTeamSeats(defaults.maxTeamSeats);
    setMaxStorageGb(defaults.maxStorageGb);
    setAiCredits(defaults.aiCredits);
    setSyncFrequencyHours(defaults.syncFrequencyHours);

    setCanCloudBackup(defaults.canCloudBackup);
    setHasApiAccess(defaults.hasApiAccess);
    setHasFeedDiff(defaults.hasFeedDiff);
    setHasWebhooks(defaults.hasWebhooks);
    setHasCustomS3(defaults.hasCustomS3);
    setHasAuditLog(defaults.hasAuditLog);
    setHasWhiteLabel(defaults.hasWhiteLabel);
    setHasPriorityAi(defaults.hasPriorityAi);
    setSlaUptimePercent(defaults.slaUptimePercent);

    setFeaturesUk(defaults.featuresUk);
    setFeaturesEn(defaults.featuresEn);
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

      const fields = {
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
      };

      const result = buildPlanSubmitPayload(fields, isEdit);
      if (result.error || !result.payload) {
        setError(result.error || 'Перевірте правильність заповнення полів');
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(result.payload, isEdit);
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
    featuresUk,
    featuresEn,
    newFeatureUk,
    setNewFeatureUk,
    newFeatureEn,
    setNewFeatureEn,
    isSubmitting,
    error,
    handleAddFeature,
    handleUpdateFeature,
    handleRemoveFeature,
    handleSubmit,
  };
}
