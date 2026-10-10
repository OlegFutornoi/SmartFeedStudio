import { Wand2, Bot, Zap, Sliders, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import { useLicense } from '@/hooks/useLicense';
import { ExpiredPlanBlocker } from '@/components/layout/ExpiredPlanBlocker';

export function AiEnrichmentPage() {
  const { t } = useTranslation(['ai', 'common']);
  const { isExpired, aiCredits } = useLicense();

  if (isExpired) {
    return <ExpiredPlanBlocker featureName={t('ai:title')} />;
  }

  return (
    <div
      data-testid="ai-enrichment-page"
      className="max-w-6xl mx-auto space-y-4 animate-in fade-in duration-300"
    >
      {/* Top Action Toolbar */}
      <div className="flex items-center justify-end">
        <Badge
          variant="outline"
          className="text-xs bg-primary/10 text-primary border-primary/20 px-2.5 py-1 gap-1.5 font-mono shadow-xs"
        >
          <Zap className="h-3 w-3" />
          <span>
            {aiCredits} {t('ai:creditsRemaining')}
          </span>
        </Badge>
      </div>

      {/* AI Features Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/80 bg-card shadow-xs hover:border-border transition-colors">
          <CardHeader className="pb-3">
            <div className="p-2 w-fit rounded-lg bg-primary/10 text-primary mb-1">
              <Wand2 className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-semibold tracking-tight">
              {t('ai:seoTitle')}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {t('ai:seoDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="sm"
              className="w-full text-xs h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
            >
              <span>{t('ai:startBatch')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-xs hover:border-border transition-colors">
          <CardHeader className="pb-3">
            <div className="p-2 w-fit rounded-lg bg-primary/10 text-primary mb-1">
              <Sliders className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-semibold tracking-tight">
              {t('ai:specsTitle')}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {t('ai:specsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" variant="outline" className="w-full text-xs h-8 gap-1.5">
              <span>{t('ai:generationSettings')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-xs hover:border-border transition-colors">
          <CardHeader className="pb-3">
            <div className="p-2 w-fit rounded-lg bg-primary/10 text-primary mb-1">
              <Bot className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-semibold tracking-tight">
              {t('ai:translateTitle')}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {t('ai:translateDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" variant="outline" className="w-full text-xs h-8 gap-1.5">
              <span>{t('ai:customPrompt')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
