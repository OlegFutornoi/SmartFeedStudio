import { useMemo } from 'react';
import { FeedAnalysisResult } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingBag,
  Layers,
  CheckCircle2,
  TrendingUp,
  Tag,
  ChevronRight,
  PackageCheck,
} from 'lucide-react';
import { useTranslation } from '@/i18n';

interface FeedAnalysisCardProps {
  analysis: FeedAnalysisResult;
}

const FORMAT_COLORS: Record<string, string> = {
  XML_ROZETKA: 'bg-secondary text-secondary-foreground border-border',
  YML: 'bg-secondary text-secondary-foreground border-border',
  GOOGLE_SHOPPING_RSS: 'bg-secondary text-secondary-foreground border-border',
  CSV: 'bg-secondary text-secondary-foreground border-border',
  XML: 'bg-secondary text-secondary-foreground border-border',
};

const FORMAT_LABELS: Record<string, string> = {
  XML_ROZETKA: 'Rozetka XML',
  YML: 'Prom YML',
  GOOGLE_SHOPPING_RSS: 'Google RSS',
  CSV: 'CSV',
  XML: 'XML',
};

export function FeedAnalysisCard({ analysis }: FeedAnalysisCardProps) {
  const { t } = useTranslation(['suppliers', 'common']);

  const inStockCount = useMemo(
    () => analysis.sampleProducts.filter((p) => p.inStock).length,
    [analysis.sampleProducts],
  );

  const inStockPercent = useMemo(() => {
    if (analysis.sampleProducts.length === 0) return null;
    return Math.round((inStockCount / analysis.sampleProducts.length) * 100);
  }, [inStockCount, analysis.sampleProducts.length]);

  const topCategories = useMemo(
    () =>
      [...(analysis.categories || [])]
        .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
        .slice(0, 6),
    [analysis.categories],
  );

  const formatKey = analysis.format?.toUpperCase() || 'XML';
  const formatColor = FORMAT_COLORS[formatKey] || 'bg-secondary text-foreground border-border';
  const formatLabel = FORMAT_LABELS[formatKey] || analysis.format;

  return (
    <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <CheckCircle2 className="size-3.5" />
          {t('suppliers:analysisSuccess', { defaultValue: 'Фід успішно проаналізовано' })}
        </div>
        <Badge className={`text-[10px] font-mono border px-2 py-0.5 ${formatColor}`}>
          {formatLabel}
        </Badge>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-px bg-border/30">
        {/* Total SKU */}
        <div className="flex flex-col items-center justify-center gap-0.5 py-3 px-2 bg-card/80">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
            <ShoppingBag className="size-3 text-primary" />
            {t('suppliers:totalProductsFound', { defaultValue: 'Знайдено товарів' })}
          </div>
          <div className="text-lg font-bold font-mono text-foreground leading-tight">
            {analysis.totalDetected.toLocaleString('uk-UA')}
            <span className="text-xs font-normal text-muted-foreground ml-1">SKU</span>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-col items-center justify-center gap-0.5 py-3 px-2 bg-card/80">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
            <Layers className="size-3 text-primary" />
            {t('suppliers:categoriesFound', { defaultValue: 'Категорій' })}
          </div>
          <div className="text-lg font-bold font-mono text-foreground leading-tight">
            {analysis.categoriesCount || analysis.categories?.length || 0}
          </div>
        </div>

        {/* In Stock % */}
        <div className="flex flex-col items-center justify-center gap-0.5 py-3 px-2 bg-card/80">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
            <PackageCheck className="size-3 text-primary" />
            {t('suppliers:inStockPercent', { defaultValue: 'В наявності' })}
          </div>
          <div className="text-lg font-bold font-mono text-foreground leading-tight">
            {inStockPercent !== null ? (
              <span>
                {inStockPercent}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">%</span>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="px-4 py-3 space-y-1.5">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="size-3" />
            {t('suppliers:topCategoriesTitle', { defaultValue: 'Топ категорії' })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {topCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/50 hover:bg-secondary/70 transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <ChevronRight className="size-3 text-primary shrink-0" />
                  <span className="text-xs text-foreground truncate font-medium" title={cat.name}>
                    {cat.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <TrendingUp className="size-2.5 text-muted-foreground" />
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {(cat.productCount || 0).toLocaleString('uk-UA')} SKU
                  </span>
                </div>
              </div>
            ))}
          </div>
          {analysis.categories.length > 6 && (
            <p className="text-[10px] text-muted-foreground text-center pt-0.5">
              {t('suppliers:andMoreCategories', {
                count: analysis.categories.length - 6,
                defaultValue: `...та ще ${analysis.categories.length - 6} категорій`,
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
