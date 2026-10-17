import React, { useState, useRef } from 'react';
import { Globe, FileText, UploadCloud, Loader2, Sparkles, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/i18n';
import { FeedAnalysisResult } from '@/lib/api';
import { FeedAnalysisCard } from '@/components/feeds/FeedAnalysisCard';
import { FeedAnalysisInteractiveLoader } from '@/components/feeds/FeedAnalysisInteractiveLoader';
import { WizardAiAssistantShowcase } from '@/components/feeds/WizardAiAssistantShowcase';

interface WizardStepSourceProps {
  sourceType: 'URL' | 'FILE';
  setSourceType: (type: 'URL' | 'FILE') => void;
  feedUrl: string;
  setFeedUrl: (url: string) => void;
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

  const ALLOWED_EXTENSIONS = ['xml', 'yml', 'csv', 'tsv', 'xlsx', 'xls', 'txt'];

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
    };
    reader.readAsText(file);
  };

  const handlePickFile = () => fileInputRef.current?.click();

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

  const testLivoloUrl =
    'https://livolo.kiev.ua/products_feed.xml?hash_tag=313e3f0e4bd4878fa657c5c5d544b64d&sales_notes=&product_ids=&label_ids=&exclude_fields=&html_description=1&yandex_cpa=&process_presence_sure=&languages=uk%2Cru&extra_fields=&group_ids=';

  const displayedError = error || fileValidationError;

  return (
    <div className="space-y-4">
      {displayedError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{displayedError}</span>
        </div>
      )}

      {/* Smart Dual Source Input: URL or File */}
      <div className="p-3.5 rounded-2xl border border-border/70 bg-card shadow-2xs space-y-3">
        {/* 1. URL Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-foreground font-medium flex items-center gap-1.5">
              <Globe className="size-3.5 text-primary" />
              {t('suppliers:feedUrlLabel', { defaultValue: 'URL-адреса XML / CSV фіду' })}
            </Label>
            <Button
              variant="link"
              size="sm"
              type="button"
              onClick={() => {
                setSourceType('URL');
                onFileSelect('', '');
                setFeedUrl(testLivoloUrl);
              }}
              className="h-auto p-0 text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Sparkles className="size-3" />
              {t('suppliers:pasteLivoloUrl', { defaultValue: 'Тестовий фід Livolo' })}
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="https://supplier.com/products_feed.xml"
              value={feedUrl}
              onChange={(e) => {
                setFeedUrl(e.target.value);
                setSourceType('URL');
                if (fileName) {
                  onFileSelect('', '');
                }
              }}
              className="h-9 text-xs font-mono bg-background/60 flex-1"
              disabled={isAnalyzing}
            />
            <Button
              type="button"
              onClick={() => {
                setSourceType('URL');
                onAnalyzeUrl();
              }}
              disabled={!feedUrl.trim() || isAnalyzing}
              className="h-9 text-xs px-3.5 shrink-0"
              data-testid="analyze-url-btn"
            >
              {isAnalyzing && sourceType === 'URL' ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  {t('suppliers:analyzing', { defaultValue: 'Аналіз...' })}
                </>
              ) : (
                t('suppliers:analyzeFeed', { defaultValue: 'Аналізувати' })
              )}
            </Button>
          </div>
        </div>

        {/* Subtle Divider */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <span className="relative bg-card px-2 text-3xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('common:or', { defaultValue: 'або' })}
          </span>
        </div>

        {/* 2. File Upload Dropzone Section */}
        <div>
          <input
            ref={fileInputRef}
            id="feed-file-upload"
            data-testid="feed-file-upload"
            type="file"
            accept=".xml,.yml,.csv,.tsv,.xlsx,.xls,.txt"
            className="hidden"
            onChange={handleFileChange}
            disabled={isAnalyzing}
          />

          {fileName ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{fileName}</p>
                  <p className="text-3xs text-muted-foreground">
                    {analysis
                      ? t('suppliers:feedAnalyzedSuccess', { defaultValue: 'Фід проаналізовано' })
                      : t('suppliers:readyToAnalyze', { defaultValue: 'Готовий до аналізу' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFileValidationError(null);
                    onFileSelect('', '');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="h-7 px-2 text-3xs text-muted-foreground hover:text-destructive"
                  disabled={isAnalyzing}
                >
                  <X className="size-3.5" />
                </Button>
                {onAnalyzeFile && !analysis && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setSourceType('FILE');
                      onAnalyzeFile();
                    }}
                    disabled={isAnalyzing}
                    className="h-7 text-xs px-3"
                    data-testid="analyze-file-btn"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        {t('suppliers:analyzing', { defaultValue: 'Аналіз...' })}
                      </>
                    ) : (
                      t('suppliers:analyzeFeed', { defaultValue: 'Аналізувати' })
                    )}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div
              data-testid="dropzone-feed-upload"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={!isAnalyzing ? handlePickFile : undefined}
              className={`border border-dashed rounded-xl p-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-2.5 ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border/70 hover:border-primary/40 bg-secondary/15 hover:bg-secondary/25'
              }`}
            >
              <UploadCloud className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">
                {t('suppliers:dragDropOrBrowse', {
                  defaultValue: 'Перетягніть XML, YML або CSV файл сюди, або натисніть для вибору',
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Loading & Skeleton State */}
      {isAnalyzing && <FeedAnalysisInteractiveLoader isAnalyzing={isAnalyzing} />}

      {/* Inline Analysis Result Card */}
      {analysis && !isAnalyzing && !error && <FeedAnalysisCard analysis={analysis} />}

      {/* Empty Space filler: Premium AI Assistant Showcase */}
      {!analysis && !isAnalyzing && <WizardAiAssistantShowcase />}
    </div>
  );
}
