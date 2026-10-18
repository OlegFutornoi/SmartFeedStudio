import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CreateMarketplaceCategoryDto } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';
import { parseCategoryFileContent } from '@/modules/suppliers/components/details/tabs/marketplace-category-file-parser';

interface MarketplaceCategoryImportFormProps {
  marketplaceCode: string;
  xmlAttributeName: string;
  onImport: (items: CreateMarketplaceCategoryDto[]) => Promise<{ importedCount: number }>;
  onCancel: () => void;
}

export const MarketplaceCategoryImportForm: React.FC<MarketplaceCategoryImportFormProps> = ({
  marketplaceCode,
  xmlAttributeName,
  onImport,
  onCancel,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedItems, setParsedItems] = useState<CreateMarketplaceCategoryDto[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) throw new Error('Файл порожній');
        const items = parseCategoryFileContent(
          file.name,
          content,
          marketplaceCode,
          xmlAttributeName,
        );
        setParsedItems(items);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Помилка зчитування файлу';
        setErrorMsg(msg);
        setParsedItems([]);
      }
    };

    reader.readAsText(file, 'utf-8');
  };

  const handleDownloadSampleCsv = () => {
    const csvContent =
      'id;name;commission;path\n' +
      '4629471;Вимикачі світла;12;Електромонтажне обладнання > Вимикачі\n' +
      '4662497;Розумні вимикачі;12;Розумний дім > Розумні вимикачі\n' +
      '4674585;Зарядні станції;7.5;Джерела живлення > Зарядні станції\n' +
      '4629470;Розетки силові;10;Електромонтажне обладнання > Розетки';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sample_${marketplaceCode.toLowerCase()}_categories.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConfirmImport = async () => {
    if (parsedItems.length === 0) return;
    setIsImporting(true);
    try {
      await onImport(parsedItems);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Помилка збереження імпорту');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div
      className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-3"
      data-testid="marketplace-category-import-form"
    >
      <div className="flex items-center justify-between pb-1 border-b border-border/60">
        <div>
          <span className="text-xs font-semibold text-foreground">
            {t('suppliers:importCategoriesTitle', { defaultValue: 'Імпорт категорій з файлу' })}
          </span>
          <p className="text-2xs text-muted-foreground">
            {t('suppliers:importCategoriesDesc', {
              defaultValue:
                'Рекомендований формат: CSV (UTF-8, роздільник крапка з комою «;» або кома «,»)',
            })}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="size-6 p-0 text-muted-foreground hover:text-foreground"
          aria-label={t('common:cancel', { defaultValue: 'Скасувати' })}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.txt,.tsv,.json"
          className="hidden"
          data-testid="category-import-file-input"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 text-xs gap-1.5"
          data-testid="category-import-browse-btn"
        >
          <Upload className="size-3.5" />
          {fileName
            ? fileName
            : t('suppliers:importDropzoneText', { defaultValue: 'Обрати файл (CSV або JSON)' })}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDownloadSampleCsv}
          className="h-8 text-2xs text-muted-foreground hover:text-foreground gap-1"
          data-testid="download-sample-csv-btn"
        >
          <Download className="size-3" />
          {t('suppliers:importSampleCsvBtn', { defaultValue: 'Зразок CSV' })}
        </Button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-1.5 p-2 rounded-md bg-destructive/10 text-destructive text-2xs">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {parsedItems.length > 0 && (
        <div className="p-2.5 rounded-md border border-border/70 bg-background/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <CheckCircle2 className="size-3.5 text-success" />
              {t('suppliers:importPreviewCount', {
                count: parsedItems.length,
                defaultValue: `Готово до імпорту: ${parsedItems.length} категорій`,
              })}
            </span>
            <Badge variant="outline" className="text-2xs font-mono">
              {marketplaceCode}
            </Badge>
          </div>

          <div className="max-h-28 overflow-y-auto divide-y divide-border/40 text-2xs">
            {parsedItems.slice(0, 3).map((item, idx) => (
              <div key={idx} className="py-1 flex items-center justify-between gap-2">
                <span className="font-medium text-foreground truncate">{item.nameUk}</span>
                <span className="font-mono text-muted-foreground shrink-0">
                  {xmlAttributeName}: {item.externalId} ({item.defaultCommissionPercent}%)
                </span>
              </div>
            ))}
            {parsedItems.length > 3 && (
              <p className="pt-1 text-center text-muted-foreground italic">
                {t('suppliers:importMoreCategoriesCount', {
                  count: parsedItems.length - 3,
                  defaultValue: `... ще ${parsedItems.length - 3} категорій`,
                })}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-1.5 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="h-7 text-xs"
        >
          {t('common:cancel', { defaultValue: 'Скасувати' })}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isImporting || parsedItems.length === 0}
          onClick={handleConfirmImport}
          className="h-7 text-xs gap-1.5"
          data-testid="category-import-submit-btn"
        >
          {isImporting ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <FileText className="size-3" />
          )}
          {parsedItems.length > 0
            ? t('suppliers:btnConfirmImportCount', {
                count: parsedItems.length,
                defaultValue: `Імпортувати (${parsedItems.length})`,
              })
            : t('suppliers:btnConfirmImport', { defaultValue: 'Імпортувати' })}
        </Button>
      </div>
    </div>
  );
};
