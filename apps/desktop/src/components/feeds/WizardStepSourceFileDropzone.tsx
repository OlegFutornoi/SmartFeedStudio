import React from 'react';
import { FileText, UploadCloud, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedCollisionResultDto, FeedCollisionType } from '@smartfeed/shared';
import { FeedAnalysisResult } from '@/lib/api';

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
              onClick={onClearFile}
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
          onDrop={onDrop}
          onClick={!isAnalyzing ? onPickFile : undefined}
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
  );
};
