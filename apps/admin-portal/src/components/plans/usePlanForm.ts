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

  const [code, setCode] = useState('');
  const [nameUk, setNameUk] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descriptionUk, setDescriptionUk] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [priceMonthly, setPriceMonthly] = useState('0');
  const [priceYearly, setPriceYearly] = useState('');
  const [maxXmlLimit, setMaxXmlLimit] = useState('1000');
  const [aiCredits, setAiCredits] = useState('50');
  const [canCloudBackup, setCanCloudBackup] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
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
      setMaxXmlLimit(initialData.maxXmlLimit.toString());
      setAiCredits(initialData.aiCredits.toString());
      setCanCloudBackup(initialData.canCloudBackup);
      setIsPopular(initialData.isPopular);
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
      setMaxXmlLimit('1000');
      setAiCredits('50');
      setCanCloudBackup(false);
      setIsPopular(false);
      setFeaturesUk([]);
      setFeaturesEn([]);
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleAddFeature = useCallback(() => {
    if (newFeatureUk.trim()) {
      setFeaturesUk((prev) => [...prev, newFeatureUk.trim()]);
      setNewFeatureUk('');
    }
    if (newFeatureEn.trim()) {
      setFeaturesEn((prev) => [...prev, newFeatureEn.trim()]);
      setNewFeatureEn('');
    }
  }, [newFeatureUk, newFeatureEn]);

  const handleRemoveFeature = useCallback((index: number) => {
    setFeaturesUk((prev) => prev.filter((_, i) => i !== index));
    setFeaturesEn((prev) => prev.filter((_, i) => i !== index));
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
        currency: 'USD',
        maxXmlLimit: parseInt(maxXmlLimit, 10) || 1000,
        aiCredits: parseInt(aiCredits, 10) || 0,
        canCloudBackup,
        isPopular,
        isActive: true,
        order: initialData?.order ?? 0,
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
      maxXmlLimit,
      aiCredits,
      canCloudBackup,
      isPopular,
      initialData?.order,
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
    maxXmlLimit,
    setMaxXmlLimit,
    aiCredits,
    setAiCredits,
    canCloudBackup,
    setCanCloudBackup,
    isPopular,
    setIsPopular,
    featuresUk,
    featuresEn,
    newFeatureUk,
    setNewFeatureUk,
    newFeatureEn,
    setNewFeatureEn,
    isSubmitting,
    error,
    handleAddFeature,
    handleRemoveFeature,
    handleSubmit,
  };
}
