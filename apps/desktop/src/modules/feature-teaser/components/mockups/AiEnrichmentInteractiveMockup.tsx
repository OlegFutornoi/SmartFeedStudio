import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  CheckCircle2,
  ArrowRight,
  Bot,
  SlidersHorizontal,
  RefreshCw,
  X,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n';

export const AiEnrichmentInteractiveMockup: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['featureTeaser']);
  const [activeTab, setActiveTab] = useState<'rozetka' | 'prom' | 'specs'>('rozetka');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 400);
  };

  return (
    <Card
      data-testid="ai-interactive-mockup"
      className="border border-border/80 bg-card shadow-lg overflow-hidden backdrop-blur-sm relative"
    >
      <CardHeader className="bg-muted/30 border-b border-border/80 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>{t('featureTeaser.aiEnrichment.mockup.title')}</span>
              </CardTitle>
              <Badge
                variant="secondary"
                className="text-[10px] bg-primary/10 text-primary border-primary/20"
              >
                AI Sandbox
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              {t('featureTeaser.aiEnrichment.mockup.subtitle')}
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={() => setShowUpgradeModal(true)}
            data-testid="ai-batch-generate-btn"
            className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 shadow-xs"
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span>{t('featureTeaser.aiEnrichment.mockup.batchButton')}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Style selection tabs */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeTab === 'rozetka' ? 'default' : 'outline'}
            onClick={() => setActiveTab('rozetka')}
            className="text-xs h-7 px-2.5"
          >
            {t('featureTeaser.aiEnrichment.mockup.tabs.rozetka')}
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'prom' ? 'default' : 'outline'}
            onClick={() => setActiveTab('prom')}
            className="text-xs h-7 px-2.5"
          >
            {t('featureTeaser.aiEnrichment.mockup.tabs.prom')}
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'specs' ? 'default' : 'outline'}
            onClick={() => setActiveTab('specs')}
            className="text-xs h-7 px-2.5"
          >
            {t('featureTeaser.aiEnrichment.mockup.tabs.specs')}
          </Button>
        </div>

        {/* Before / After comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source product row */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-2">
            <div className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center justify-between">
              <span>{t('featureTeaser.aiEnrichment.mockup.rawTitle')}</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground">
                {t('featureTeaser.aiEnrichment.mockup.inputBadge')}
              </Badge>
            </div>
            <div className="p-2.5 rounded-lg bg-background/80 border border-border/60 text-xs font-mono text-foreground/90">
              {t('featureTeaser.aiEnrichment.mockup.sampleSourceText')}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t('featureTeaser.aiEnrichment.mockup.rawDescription')}
            </p>
          </div>

          {/* AI Result row */}
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2 relative">
            <div className="text-[11px] font-semibold uppercase text-primary tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5 text-primary" />
                {t('featureTeaser.aiEnrichment.mockup.aiResultTitle')}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="h-5 px-1 text-[10px] gap-1 text-primary hover:text-primary/80"
              >
                <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
                {t('featureTeaser.aiEnrichment.mockup.regenerate')}
              </Button>
            </div>

            <div className="p-2.5 rounded-lg bg-background border border-primary/25 text-xs text-foreground space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-foreground shrink-0" />
                {activeTab === 'rozetka' && t('featureTeaser.aiEnrichment.mockup.samples.rozetka')}
                {activeTab === 'prom' && t('featureTeaser.aiEnrichment.mockup.samples.prom')}
                {activeTab === 'specs' && t('featureTeaser.aiEnrichment.mockup.samples.specs')}
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                <Badge
                  variant="outline"
                  className="text-[9px] bg-primary/10 text-primary border-primary/20"
                >
                  {t('featureTeaser.aiEnrichment.mockup.tags.seo')}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[9px] bg-secondary text-secondary-foreground border-border"
                >
                  {t('featureTeaser.aiEnrichment.mockup.tags.keywords')}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info banner */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/70 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            {t('featureTeaser.aiEnrichment.mockup.footerPrompt')}
          </span>
          <span className="font-medium text-primary">
            {t('featureTeaser.aiEnrichment.mockup.creditsNotice')}
          </span>
        </div>
      </CardContent>

      {/* Upgrade Dialog Modal Overlay (100% solid opaque) */}
      {showUpgradeModal && (
        <div
          data-testid="ai-upgrade-dialog"
          className="absolute inset-0 z-30 bg-background/90 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50 duration-200"
        >
          <div className="bg-card border border-border rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  {t('featureTeaser.aiEnrichment.dialog.title')}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('featureTeaser.aiEnrichment.dialog.desc')}
            </p>

            <div className="space-y-2 py-1">
              <div className="flex items-center gap-2 text-xs text-foreground">
                <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                <span>{t('featureTeaser.aiEnrichment.dialog.benefit1')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground">
                <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                <span>{t('featureTeaser.aiEnrichment.dialog.benefit2')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground">
                <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                <span>{t('featureTeaser.aiEnrichment.dialog.benefit3')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                data-testid="ai-upgrade-confirm-btn"
                onClick={() => {
                  setShowUpgradeModal(false);
                  navigate('/plans?highlight=GROWTH');
                }}
                className="flex-1 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-1.5"
              >
                <span>{t('featureTeaser.aiEnrichment.dialog.upgradeButton')}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUpgradeModal(false)}
                className="text-xs font-medium"
              >
                {t('featureTeaser.common.cancel', { defaultValue: 'Скасувати' })}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
