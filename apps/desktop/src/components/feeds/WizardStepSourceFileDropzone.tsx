import React from 'react';
import { FileText, UploadCloud, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedCollisionResultDto, FeedCollisionType } from '@smartfeed/shared';
import { FeedAnalysisResult } from '@/lib/api';

const SUPPORTED_BADGES = ['XML', 'YML', 'CSV', 'XLSX'] as const;

interface WizardStepSourceFileDropzoneProps {
  fileName: string | null;
  analysis?: FeedAnalysisResult | null;
  isAnalyzing: boolean;
  isCheckingCollision?: boolean;
  collisionResult?: FeedCollisionResultDto | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
  onAnalyzeFile?: () => void;
  onPickFile: () => void;
  onDrop: (e: React.DragEvent) => void;
  dragOver: boolean;
  setDragOver: (over: boolean) => void;
  t: (key: string, options?: { defaultValue?: string }) => string;
}

export const WizardStepSourceFileDropzone: React.FC<WizardStepSourceFileDropzoneProps> = ({
  fileName,
  analysis,
  isAnalyzing,
  isCheckingCollision,
  collisionResult,
  fileInputRef,
  onFileChange,
  onClearFile,
  onAnalyzeFile,
  onPickFile,
  onDrop,
  dragOver,
  setDragOver,
  t,
}) => {
  return (
    <div>
      <input
        ref={fileInputRef}
        id="feed-file-upload"
        data-testid="feed-file-upload"
        type="file"
        accept=".xml,.yml,.csv,.tsv,.xlsx,.xls,.txt"
        className="hidden"
        onChange={onFileChange}
        disabled={isAnalyzing}
      />

      {fileName ? (
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/25">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-md bg-card border border-border/60 text-foreground flex items-center justify-center shrink-0">
              <FileText className="size-4 text-muted-foreground" />
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
              onClick={onClearFile}
              aria-label={t('suppliers:clearSelectedFileAria', {
                defaultValue: 'Очистити обраний файл',
              })}
              className="h-7 px-2 text-3xs text-muted-foreground hover:text-destructive"
              disabled={isAnalyzing}
            >
              <X className="size-3.5" />
            </Button>
            {onAnalyzeFile && !analysis && (
              <Button
                type="button"
                size="sm"
                onClick={onAnalyzeFile}
                disabled={
                  isAnalyzing ||
                  isCheckingCollision ||
                  collisionResult?.collisionType === FeedCollisionType.SAME_SUPPLIER_DUPLICATE
                }
                className="h-7 text-xs px-3"
                data-testid="analyze-file-btn"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    {t('suppliers:analyzing', { defaultValue: 'Аналіз…' })}
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
          role="button"
          tabIndex={isAnalyzing ? -1 : 0}
          data-testid="dropzone-feed-upload"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={!isAnalyzing ? onPickFile : undefined}
          onKeyDown={(e) => {
            if (!isAnalyzing && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onPickFile();
            }
          }}
          className={`border border-dashed rounded-lg px-3.5 py-2.5 transition-colors cursor-pointer flex items-center justify-between gap-3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border/70 hover:border-border bg-muted/20 hover:bg-muted/40'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <UploadCloud className="size-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground font-medium truncate">
              {t('suppliers:dragDropOrBrowse', {
                defaultValue: 'Перетягніть XML, YML або CSV файл сюди, або натисніть для вибору',
              })}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 shrink-0">
            {SUPPORTED_BADGES.map((fmt) => (
              <span
                key={fmt}
                className="px-1.5 py-0.5 rounded bg-background border border-border/60 text-3xs font-mono text-muted-foreground"
              >
                .{fmt.toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
