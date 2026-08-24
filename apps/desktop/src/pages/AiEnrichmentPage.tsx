import { useState } from 'react';
import { Sparkles, Wand2, Bot, Zap, Sliders, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';

export function AiEnrichmentPage() {
  const { language } = useTranslation();
  const isUk = language === 'uk';

  const [aiCredits] = useState(500);

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
                {isUk ? 'AI Збагачення контенту' : 'AI Content Enrichment'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isUk
                  ? 'Автоматична генерація SEO-описів, характеристик та перекладів карток товарів'
                  : 'Automated generation of SEO descriptions, specifications, and translations'}
              </p>
            </div>
          </div>
        </div>

        <Badge
          variant="outline"
          className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30 px-3 py-1.5 gap-1.5 self-start sm:self-auto"
        >
          <Zap className="h-3.5 w-3.5" />
          <span>
            {aiCredits} {isUk ? 'AI Кредитів доступно' : 'AI Credits available'}
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
            <CardTitle className="text-base">
              {isUk ? 'Генератор описів' : 'Description Generator'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isUk
                ? 'Створення унікальних продаючих описів товарів за шаблонами маркетплейсів'
                : 'Create engaging e-commerce product copy optimized for conversion'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/25">
              <span>{isUk ? 'Запустити пакетну обробку' : 'Start Batch Run'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 backdrop-blur-md hover:border-blue-500/40 transition-colors">
          <CardHeader>
            <div className="p-2.5 w-fit rounded-xl bg-blue-500/10 text-blue-400 mb-2">
              <Sliders className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">
              {isUk ? 'Нормалізація параметрів' : 'Attribute Normalization'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isUk
                ? 'Приведення характеристик та категорій до єдиного стандарту Rozetka/Prom'
                : 'Normalize technical attributes and categories across multiple marketplaces'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full text-xs gap-1.5">
              <span>{isUk ? 'Налаштувати правила' : 'Configure Rules'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 backdrop-blur-md hover:border-emerald-500/40 transition-colors">
          <CardHeader>
            <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 mb-2">
              <Bot className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">
              {isUk ? 'SEO & Ключові слова' : 'SEO Keywords AI'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isUk
                ? 'Підбір пошукових тегів, Meta Title та Meta Description для Google Shopping'
                : 'Extract high-ranking keywords, Meta Titles, and Descriptions for Google Ads'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full text-xs gap-1.5">
              <span>{isUk ? 'Оптимізувати теги' : 'Optimize Tags'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
