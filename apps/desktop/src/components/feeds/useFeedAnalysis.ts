import { useState } from 'react';
import { analyzeFeedUrl, analyzeFeedContent, type FeedAnalysisResult } from '@/lib/api';
import { getFeedAnalysisErrorMessage } from '@/components/feeds/feedErrorMessages';

interface UseFeedAnalysisOptions {
  t: (key: string, options?: { defaultValue?: string }) => string;
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

  const performAnalysis = async (
    customContent?: string,
    customUrl?: string,
    forcedType?: 'URL' | 'FILE',
  ): Promise<boolean> => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);
    try {
      const activeType = forcedType ?? (fileName ? 'FILE' : sourceType);
      let result: FeedAnalysisResult;
      let targetUrl = (customUrl ?? feedUrl).trim();
      const targetContent = customContent ?? fileContent;

      if (activeType === 'URL') {
        if (!targetUrl) {
          setAnalysisError(
            t('suppliers:enterFeedUrl', { defaultValue: 'Введіть посилання на фід' }),
          );
          setIsAnalyzing(false);
          return false;
        }
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
          targetUrl = `https://${targetUrl}`;
          setFeedUrl(targetUrl);
        }
        result = await analyzeFeedUrl(
          targetUrl,
          selectedSupplierId || undefined,
          token || undefined,
        );
      } else {
        if (!targetContent) {
          setAnalysisError(
            t('suppliers:chooseFileForImport', { defaultValue: 'Оберіть файл для імпорту' }),
          );
          setIsAnalyzing(false);
          return false;
        }
        result = await analyzeFeedContent(targetContent, selectedSupplierId || undefined);
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
    performAnalysis,
    handleAnalyzeUrl,
    handleAnalyzeFile,
    handleAnalyzeOnly,
  };
}
