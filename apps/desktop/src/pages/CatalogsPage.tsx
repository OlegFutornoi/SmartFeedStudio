import { useState, useMemo } from 'react';
import { Layers, Plus, Upload, RefreshCw, CheckCircle2, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';

interface CatalogItem {
  id: string;
  name: string;
  source: string;
  productsCount: number;
  lastSync: string;
  status: 'Synced' | 'Processing' | 'Error';
  format: 'XML' | 'CSV' | 'YML';
}

export function CatalogsPage() {
  const { language } = useTranslation();
  const isUk = language === 'uk';

  const [search, setSearch] = useState('');
  const [catalogs] = useState<CatalogItem[]>([
    {
      id: 'cat-1',
      name: 'Основний каталог товарів (Rozetka XML)',
      source: 'https://feed.myshop.ua/rozetka.xml',
      productsCount: 14250,
      lastSync: '2026-08-24 18:30',
      status: 'Synced',
      format: 'XML',
    },
    {
      id: 'cat-2',
      name: 'Prom.ua Експортний фід',
      source: 'https://feed.myshop.ua/prom-catalog.xml',
      productsCount: 8920,
      lastSync: '2026-08-24 17:15',
      status: 'Synced',
      format: 'YML',
    },
    {
      id: 'cat-3',
      name: 'Google Merchant Center Feed',
      source: 'local_storage://google_feed.csv',
      productsCount: 5400,
      lastSync: '2026-08-24 12:00',
      status: 'Processing',
      format: 'CSV',
    },
  ]);

  const filteredCatalogs = useMemo(
    () =>
      catalogs.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.format.toLowerCase().includes(search.toLowerCase()),
      ),
    [catalogs, search],
  );

  return (
    <div
      data-testid="catalogs-page"
      className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {isUk ? 'Каталоги товарів' : 'Product Catalogs'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isUk
                  ? 'Керування імпортом, валідацією та синхронізацією XML/CSV фідів'
                  : 'Manage import, validation, and synchronization of XML/CSV product feeds'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 text-xs h-9">
            <Upload className="h-4 w-4" />
            <span>{isUk ? 'Імпорт файлу' : 'Import File'}</span>
          </Button>
          <Button className="gap-2 text-xs h-9 shadow-md shadow-primary/25">
            <Plus className="h-4 w-4" />
            <span>{isUk ? 'Додати каталог' : 'Add Catalog'}</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/80 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isUk ? 'Всього каталогів' : 'Total Catalogs'}
            </CardTitle>
            <Layers className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{catalogs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isUk ? '3 активних джерела' : '3 active sources'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isUk ? 'Всього товарів' : 'Total Products'}
            </CardTitle>
            <FileText className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">28,570</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isUk ? 'Оброблено у SQLCipher DB' : 'Indexed in SQLCipher'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isUk ? 'Статус синхронізації' : 'Sync Status'}
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground flex items-center gap-2">
              <span>{isUk ? 'В нормі' : 'Healthy'}</span>
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isUk ? 'Останній зріз 18:30' : 'Latest snapshot 18:30'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Catalogs List */}
      <Card className="border-border/80 bg-card/60 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">
              {isUk ? 'Підключені фіди' : 'Connected Feeds'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isUk
                ? 'Список активних XML каталогів та каналів експорту'
                : 'List of active XML catalogs and export channels'}
            </CardDescription>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={isUk ? 'Пошук каталогу...' : 'Search catalogs...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-secondary/40 border border-border/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {filteredCatalogs.map((catalog) => (
              <div
                key={catalog.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-muted/20 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-foreground">{catalog.name}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {catalog.format}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate max-w-md">
                    {catalog.source}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-semibold text-foreground">
                      {catalog.productsCount.toLocaleString()} {isUk ? 'товарів' : 'items'}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{catalog.lastSync}</div>
                  </div>

                  <Badge
                    variant={catalog.status === 'Synced' ? 'secondary' : 'default'}
                    className="text-xs flex items-center gap-1"
                  >
                    {catalog.status === 'Synced' && (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    )}
                    {catalog.status === 'Processing' && (
                      <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                    )}
                    <span>{catalog.status}</span>
                  </Badge>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
