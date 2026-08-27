import { Sparkles, Wand2, Bot, Zap, Sliders, ArrowRight } from 'lucide-react';
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
      className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {t('ai:title')}
              </h1>
              <p className="text-sm text-muted-foreground">{t('ai:description')}</p>
            </div>
          </div>
        </div>

        <Badge
          variant="outline"
          className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30 px-3 py-1.5 gap-1.5 self-start sm:self-auto"
        >
          <Zap className="h-3.5 w-3.5" />
          <span>
            {aiCredits} {t('ai:creditsRemaining')}
          </span>
        </Badge>
      </div>

      {/* AI Features Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/80 bg-card/60 backdrop-blur-md hover:border-purple-500/40 transition-colors">
          <CardHeader>
            <div className="p-2.5 w-fit rounded-xl bg-purple-500/10 text-purple-400 mb-2">
              <Wand2 className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">{t('ai:seoTitle')}</CardTitle>
            <CardDescription className="text-xs">{t('ai:seoDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/25">
              <span>{t('ai:startBatch')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 backdrop-blur-md hover:border-blue-500/40 transition-colors">
          <CardHeader>
            <div className="p-2.5 w-fit rounded-xl bg-blue-500/10 text-blue-400 mb-2">
              <Sliders className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">{t('ai:specsTitle')}</CardTitle>
            <CardDescription className="text-xs">{t('ai:specsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full text-xs gap-1.5">
              <span>{t('ai:generationSettings')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 backdrop-blur-md hover:border-emerald-500/40 transition-colors">
          <CardHeader>
            <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 mb-2">
              <Bot className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">{t('ai:translateTitle')}</CardTitle>
            <CardDescription className="text-xs">{t('ai:translateDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full text-xs gap-1.5">
              <span>{t('ai:customPrompt')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
