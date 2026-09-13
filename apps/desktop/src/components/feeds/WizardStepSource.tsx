import React, { useState, useRef } from 'react';
import { Globe, FileText, UploadCloud, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/i18n';
import { FeedAnalysisResult } from '@/lib/api';
import { FeedAnalysisCard } from './FeedAnalysisCard';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onFileSelect(file.name, content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onFileSelect(file.name, content);
    };
    reader.readAsText(file);
  };

  const testLivoloUrl =
    'https://livolo.kiev.ua/products_feed.xml?hash_tag=313e3f0e4bd4878fa657c5c5d544b64d&sales_notes=&product_ids=&label_ids=&exclude_fields=&html_description=1&yandex_cpa=&process_presence_sure=&languages=uk%2Cru&extra_fields=&group_ids=';

  return (
    <div className="space-y-4">
      {/* Source Type Toggle */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/30 rounded-lg border border-border/40">
        <button
          type="button"
          onClick={() => setSourceType('URL')}
          className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
            sourceType === 'URL'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          }`}
        >
          <Globe className="size-3.5" />
          {t('suppliers:importSourceUrl', { defaultValue: 'Посилання на фід (URL)' })}
        </button>

        <button
          type="button"
          onClick={() => setSourceType('FILE')}
          className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
            sourceType === 'FILE'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          }`}
        >
          <FileText className="size-3.5" />
          {t('suppliers:importSourceFile', { defaultValue: 'Завантажити файл' })}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {sourceType === 'URL' ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-foreground font-medium">
                {t('suppliers:feedUrlLabel', { defaultValue: 'URL-адреса XML / CSV фіду' })}
              </Label>
              <button
                type="button"
                onClick={() => {
                  setFeedUrl(testLivoloUrl);
                }}
                className="text-[11px] text-primary hover:underline flex items-center gap-1"
              >
                <Sparkles className="size-3" />
                {t('suppliers:pasteLivoloUrl', { defaultValue: 'Тестовий фід Livolo' })}
              </button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="https://supplier.com/products_feed.xml"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                className="h-9 text-xs font-mono bg-background/50 flex-1"
                disabled={isAnalyzing}
              />
              <Button
                type="button"
                onClick={onAnalyzeUrl}
                disabled={!feedUrl.trim() || isAnalyzing}
                className="h-9 text-xs px-3 shrink-0"
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
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t('suppliers:feedUrlHint', {
                defaultValue:
                  'Підтримуються формати Rozetka XML, Prom YML, Google Shopping RSS та CSV.',
              })}
            </p>
          </div>

          {/* Inline Analysis Result Card */}
          {analysis && !isAnalyzing && <FeedAnalysisCard analysis={analysis} />}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Hidden native file input — triggered via ref to fix Tauri WebView label click bug */}
          <input
            ref={fileInputRef}
            id="feed-file-upload"
            data-testid="feed-file-upload"
            type="file"
            accept=".xml,.yml,.csv,.txt"
            className="hidden"
            onChange={handleFileChange}
            disabled={isAnalyzing}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={!isAnalyzing ? handlePickFile : undefined}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-border/60 hover:border-primary/40 bg-secondary/10'
            }`}
          >
            <div className="space-y-2">
              <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                {isAnalyzing ? (
                  <Loader2 className="size-5 animate-spin text-primary" />
                ) : (
                  <UploadCloud className="size-5" />
                )}
              </div>
              <div className="text-xs font-medium text-foreground">
                {isAnalyzing ? (
                  <span className="text-primary font-medium animate-pulse">
                    {t('suppliers:analyzingFile', { defaultValue: 'Аналіз структури файлу…' })}
                  </span>
                ) : fileName ? (
                  <span className="text-primary font-semibold">{fileName}</span>
                ) : (
                  t('suppliers:dragDropFile', {
                    defaultValue: 'Перетягніть файл сюди або натисніть для вибору',
                  })
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">XML, YML, CSV (до 100 МБ)</p>
            </div>
          </div>

          {fileName && !isAnalyzing && !analysis && (
            <div className="flex justify-center">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onAnalyzeFile}
                className="text-xs h-8 px-3 flex items-center gap-1.5"
              >
                <Sparkles className="size-3 text-primary" />
                {t('suppliers:analyzeFeed', { defaultValue: 'Аналізувати' })}
              </Button>
            </div>
          )}

          {/* Inline Analysis Result Card for file */}
          {analysis && !isAnalyzing && <FeedAnalysisCard analysis={analysis} />}
        </div>
      )}
    </div>
  );
}
