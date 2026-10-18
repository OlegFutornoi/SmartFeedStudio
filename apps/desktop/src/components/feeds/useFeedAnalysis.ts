import { useState, useEffect, useCallback } from 'react';
import { FeedCollisionResultDto, FeedCollisionType, FeedSourceType } from '@smartfeed/shared';
import { analyzeFeedUrl, analyzeFeedContent, type FeedAnalysisResult } from '@/lib/api';
import { getFeedAnalysisErrorMessage } from '@/components/feeds/feedErrorMessages';
import { formatFeedTitle } from '@/lib/formatters';
import { localDb } from '@/services/local-db';

interface UseFeedAnalysisOptions {
  t: (key: string, params?: Record<string, string | number>) => string;
  sourceType: 'URL' | 'FILE';
  feedUrl: string;
  setFeedUrl: (url: string) => void;
  fileName: string | null;
  fileContent: string | null;
  selectedSupplierId?: string;
  token?: string | null;
  onCategoriesDetected?: (categoryIds: string[]) => void;
}

export function useFeedAnalysis({
  t,
  sourceType,
  feedUrl,
  setFeedUrl,
  fileName,
  fileContent,
  selectedSupplierId,
  token,
  onCategoriesDetected,
}: UseFeedAnalysisOptions) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FeedAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [feedName, setFeedName] = useState<string>('');
  const [collisionResult, setCollisionResult] = useState<FeedCollisionResultDto | null>(null);
  const [isCheckingCollision, setIsCheckingCollision] = useState(false);

  const checkCollision = useCallback(
    async (
      targetSupplierId?: string,
      targetUrl?: string,
      targetFileName?: string,
      targetName?: string,
      targetFileContent?: string,
      targetSourceType?: 'URL' | 'FILE',
    ): Promise<FeedCollisionResultDto | null> => {
      const activeType = targetSourceType ?? sourceType;
      const supId = targetSupplierId || selectedSupplierId || '';
      const url = targetUrl ?? feedUrl;
      const fName = targetFileName ?? fileName;
      const effectiveUrl = activeType === 'URL' ? url.trim() : '';

      if (activeType === 'URL' && !effectiveUrl) {
        setCollisionResult(null);
        return null;
      }
      if (activeType === 'FILE' && !fName) {
        setCollisionResult(null);
        return null;
      }

      const name =
        targetName ?? feedName ?? (effectiveUrl ? formatFeedTitle(effectiveUrl) : fName || '');
      const content = targetFileContent ?? fileContent;

      setIsCheckingCollision(true);
      try {
        const colResult = await localDb.feeds.checkFeedCollision({
          supplierId: supId,
          sourceType: activeType === 'FILE' ? FeedSourceType.FILE : FeedSourceType.URL,
          sourceUrl: effectiveUrl || undefined,
          fileName: activeType === 'FILE' ? fName || undefined : undefined,
          feedName: name || undefined,
          fileContent: content || undefined,
        });
        setCollisionResult(colResult);
        return colResult;
      } catch (colErr) {
        console.warn('[useFeedAnalysis] checkCollision error:', colErr);
        return null;
      } finally {
        setIsCheckingCollision(false);
      }
    },
    [sourceType, selectedSupplierId, feedUrl, fileName, feedName, fileContent],
  );

  // Real-time reactive collision checking as soon as feedUrl, fileName, or feedName changes
  useEffect(() => {
    const trimmedUrl = feedUrl.trim();
    if (!trimmedUrl && !fileName) {
      setCollisionResult(null);
      return;
    }

    if (sourceType === 'URL' && trimmedUrl && trimmedUrl.length < 8 && !trimmedUrl.includes('.')) {
      setCollisionResult(null);
      return;
    }

    const timer = setTimeout(() => {
      void checkCollision(
        selectedSupplierId,
        sourceType === 'URL' ? trimmedUrl : undefined,
        sourceType === 'FILE' ? fileName || undefined : undefined,
        feedName || undefined,
        sourceType === 'FILE' ? fileContent || undefined : undefined,
        sourceType,
      );
    }, 250);

    return () => clearTimeout(timer);
  }, [feedUrl, fileName, selectedSupplierId, feedName, sourceType, fileContent, checkCollision]);

  const performAnalysis = async (
    customContent?: string,
    customUrl?: string,
    forcedType?: 'URL' | 'FILE',
  ): Promise<boolean> => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);

    const activeType = forcedType ?? sourceType;
    let targetUrl = (customUrl ?? feedUrl).trim();
    const targetContent = customContent ?? fileContent;

    if (activeType === 'URL') {
      if (!targetUrl) {
        setAnalysisError(t('suppliers:enterFeedUrl', { defaultValue: 'Введіть посилання на фід' }));
        setIsAnalyzing(false);
        return false;
      }
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = `https://${targetUrl}`;
        setFeedUrl(targetUrl);
      }
    } else {
      if (!targetContent) {
        setAnalysisError(
          t('suppliers:chooseFileForImport', { defaultValue: 'Оберіть файл для імпорту' }),
        );
        setIsAnalyzing(false);
        return false;
      }
    }

    const generatedName =
      activeType === 'FILE' ? fileName || 'Каталог товарів' : formatFeedTitle(targetUrl);

    const effectiveName = feedName || generatedName;
    if (!feedName) {
      setFeedName(generatedName);
    }

    // 1. INVARIANT: ПЕРЕВІРКА НА ДУБЛЬ ПЕРШОЮ СПРАВОЮ!
    // Якщо фід є дублікатом — зупиняємось негайно, НЕ опрацьовуємо його і НЕ парсимо товари!
    const colResult = await checkCollision(
      selectedSupplierId,
      activeType === 'URL' ? targetUrl : undefined,
      activeType === 'FILE' ? fileName || undefined : undefined,
      effectiveName,
      activeType === 'FILE' ? targetContent || undefined : undefined,
      activeType,
    );

    // Лише якщо це ТОЧНИЙ ДУБЛІКАТ для цього ж постачальника — зупиняємось негайно і не витрачаємо ресурси на парсинг
    if (colResult?.collisionType === FeedCollisionType.SAME_SUPPLIER_DUPLICATE) {
      setIsAnalyzing(false);
      setAnalysis(null);
      setAnalysisError(
        t('suppliers:feedSameSupplierDuplicateMsg', {
          name: colResult.existingFeedName || 'Існуючий фід',
          count: colResult.existingProductsCount || 0,
          defaultValue: `Цей фід уже підключений під назвою «${colResult.existingFeedName}» (${colResult.existingProductsCount} товарів). Створення дубліката заблоковано.`,
        }),
      );
      return false;
    }

    // 2. Лише якщо фід унікальний або колізію врегульовано — переходимо до завантаження та парсингу
    try {
      let result: FeedAnalysisResult;
      if (activeType === 'URL') {
        result = await analyzeFeedUrl(
          targetUrl,
          selectedSupplierId || undefined,
          token || undefined,
        );
      } else {
        result = await analyzeFeedContent(targetContent!, selectedSupplierId || undefined);
      }

      if (result.totalDetected === 0) {
        setAnalysisError(
          t('suppliers:errorEmptyFeedCatalog', {
            defaultValue:
              'У фіді не знайдено товарів (0 SKU). Перевірте вміст файлу або структуру каталогу.',
          }),
        );
        return false;
      }

      setAnalysis(result);
      if (result.categories && result.categories.length > 0) {
        onCategoriesDetected?.(result.categories.map((c) => c.id));
      }

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAnalysisError(getFeedAnalysisErrorMessage(msg, t));
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeUrl = async (): Promise<boolean> =>
    performAnalysis(undefined, undefined, 'URL');
  const handleAnalyzeFile = async (): Promise<boolean> =>
    performAnalysis(undefined, undefined, 'FILE');
  const handleAnalyzeOnly = async (): Promise<boolean> => performAnalysis();

  return {
    isAnalyzing,
    setIsAnalyzing,
    analysis,
    setAnalysis,
    analysisError,
    setAnalysisError,
    feedName,
    setFeedName,
    collisionResult,
    setCollisionResult,
    isCheckingCollision,
    checkCollision,
    performAnalysis,
    handleAnalyzeUrl,
    handleAnalyzeFile,
    handleAnalyzeOnly,
  };
}
