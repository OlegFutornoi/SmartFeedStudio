import React, { useState, useRef } from 'react';
import { Globe, FileText, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import type { FeedCollisionResultDto } from '@smartfeed/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/i18n';
import { formatFeedTitle } from '@/lib/formatters';
import { FeedAnalysisResult } from '@/lib/api';
import { FeedAnalysisCard } from '@/components/feeds/FeedAnalysisCard';
import { FeedAnalysisInteractiveLoader } from '@/components/feeds/FeedAnalysisInteractiveLoader';
import { WizardAiAssistantShowcase } from '@/components/feeds/WizardAiAssistantShowcase';
import { FeedCollisionNotice } from '@/components/feeds/FeedCollisionNotice';
import { WizardStepSourceFileDropzone } from '@/components/feeds/WizardStepSourceFileDropzone';

const ALLOWED_EXTENSIONS = ['xml', 'yml', 'csv', 'tsv', 'xlsx', 'xls', 'txt'];
const TEST_LIVOLO_URL =
  'https://livolo.kiev.ua/products_feed.xml?hash_tag=313e3f0e4bd4878fa657c5c5d544b64d&sales_notes=&product_ids=&label_ids=&exclude_fields=&html_description=1&yandex_cpa=&process_presence_sure=&languages=uk%2Cru&extra_fields=&group_ids=';

interface WizardStepSourceProps {
  sourceType: 'URL' | 'FILE';
  setSourceType: (type: 'URL' | 'FILE') => void;
  feedUrl: string;
  setFeedUrl: (url: string) => void;
  feedName?: string;
  setFeedName?: (name: string) => void;
  collisionResult?: FeedCollisionResultDto | null;
  isCheckingCollision?: boolean;
  fileContent: string | null;
  fileName: string | null;
  onFileSelect: (name: string, content: string) => void;
  isAnalyzing: boolean;
  onAnalyzeUrl: () => void;
  onAnalyzeFile?: () => void;
  analysis?: FeedAnalysisResult | null;
  error?: string | null;
}

export function WizardStepSource({
  sourceType,
  setSourceType,
  feedUrl,
  setFeedUrl,
  feedName,
  setFeedName,
  collisionResult,
  isCheckingCollision,
  fileName,
  onFileSelect,
  isAnalyzing,
  onAnalyzeUrl,
  onAnalyzeFile,
  analysis,
  error,
}: WizardStepSourceProps) {
  const { t } = useTranslation(['suppliers', 'common']);
  const [dragOver, setDragOver] = useState(false);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setFileValidationError(
        t('suppliers:errorInvalidFeedFileType', {
          defaultValue:
            'Непідтримуваний тип файлу. Дозволені лише формати фідів: .xml, .yml, .csv, .tsv, .xlsx, .xls.',
        }),
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileValidationError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSourceType('FILE');
      setFeedUrl('');
      onFileSelect(file.name, content);
      setFeedName?.(file.name);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndProcessFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndProcessFile(file);
  };

  const displayedError = error || fileValidationError;

  return (
    <div className="space-y-3.5">
      {displayedError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{displayedError}</span>
        </div>
      )}

      <div className="p-4 rounded-lg border border-border/60 bg-card space-y-3.5">
        {/* 1. URL Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-foreground font-medium flex items-center gap-1.5">
              <Globe className="size-3.5 text-muted-foreground" />
              {t('suppliers:feedUrlLabel', { defaultValue: 'URL-адреса XML / CSV фіду' })}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                setSourceType('URL');
                onFileSelect('', '');
                setFeedUrl(TEST_LIVOLO_URL);
                setFeedName?.('livolo.kiev.ua (products_feed.xml)');
              }}
              className="h-6 px-2 text-2xs text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1 rounded-md"
            >
              <Sparkles className="size-3 text-primary" />
              {t('suppliers:pasteLivoloUrl', { defaultValue: 'Тестовий фід Livolo' })}
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="https://supplier.com/products_feed.xml"
              value={feedUrl}
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => {
                const val = e.target.value;
                setFeedUrl(val);
                setSourceType('URL');
                if (fileName) onFileSelect('', '');
                setFeedName?.(val.trim() ? formatFeedTitle(val) : '');
              }}
              className="h-9 text-xs font-mono bg-background flex-1"
              disabled={isAnalyzing}
            />
            <Button
              type="button"
              onClick={() => {
                setSourceType('URL');
                onAnalyzeUrl();
              }}
              disabled={
                !feedUrl.trim() ||
                isAnalyzing ||
                isCheckingCollision ||
                Boolean(collisionResult?.hasCollision)
              }
              className="h-9 text-xs px-4 shrink-0"
              data-testid="analyze-url-btn"
            >
              {isAnalyzing && sourceType === 'URL' ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  {t('suppliers:analyzing', { defaultValue: 'Аналіз…' })}
                </>
              ) : (
                t('suppliers:analyzeFeed', { defaultValue: 'Аналізувати' })
              )}
            </Button>
          </div>
        </div>

        {/* Hairline Divider */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <span className="relative bg-card px-2.5 text-2xs font-medium text-muted-foreground">
            {t('common:or', { defaultValue: 'або' })}
          </span>
        </div>

        {/* 2. File Upload Dropzone Section */}
        <WizardStepSourceFileDropzone
          fileName={fileName}
          analysis={analysis}
          isAnalyzing={isAnalyzing}
          isCheckingCollision={isCheckingCollision}
          collisionResult={collisionResult}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
          onClearFile={() => {
            setFileValidationError(null);
            onFileSelect('', '');
            setFeedName?.('');
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          onAnalyzeFile={
            onAnalyzeFile
              ? () => {
                  setSourceType('FILE');
                  onAnalyzeFile();
                }
              : undefined
          }
          onPickFile={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          dragOver={dragOver}
          setDragOver={setDragOver}
          t={t}
        />

        {/* 3. Feed Name Input */}
        {feedName !== undefined && setFeedName && (
          <div className="pt-3 border-t border-border/50 space-y-1.5">
            <Label className="text-xs text-foreground font-medium flex items-center gap-1.5">
              <FileText className="size-3.5 text-muted-foreground" />
              {t('suppliers:feedNameLabel', { defaultValue: 'Назва фіду' })}
            </Label>
            <Input
              placeholder={t('suppliers:feedNamePlaceholder', {
                defaultValue: 'напр. Livolo Основний прайс',
              })}
              value={feedName}
              autoComplete="off"
              onChange={(e) => setFeedName(e.target.value)}
              className="h-9 text-xs bg-background"
              disabled={isAnalyzing}
              data-testid="wizard-feed-name-input"
            />
          </div>
        )}
      </div>

      <FeedCollisionNotice
        collisionResult={collisionResult || null}
        isChecking={isCheckingCollision}
      />

      {isAnalyzing && <FeedAnalysisInteractiveLoader isAnalyzing={isAnalyzing} />}
      {analysis && !isAnalyzing && !error && <FeedAnalysisCard analysis={analysis} />}
      {!analysis && !isAnalyzing && <WizardAiAssistantShowcase />}
    </div>
  );
}
