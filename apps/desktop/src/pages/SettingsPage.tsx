import { useState } from 'react';
import { Sliders, HardDrive } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/i18n';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { SettingsStorageTab } from '@/components/settings/SettingsStorageTab';

export function SettingsPage() {
  const { t } = useTranslation(['settings', 'common']);
  const [activeTab, setActiveTab] = useState<'general' | 'storage'>('general');

  return (
    <div
      data-testid="settings-page"
      className="max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300"
    >
      {/* Top Header & Tab Navigation Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/40">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {t('settings:title')}
          </h1>
          <p className="text-xs text-muted-foreground">{t('settings:settingsDesc')}</p>
        </div>

        <div className="flex items-center p-1 bg-secondary/50 rounded-xl border border-border/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            data-testid="general-tab-btn"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'general'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sliders className="size-3.5" />
            <span>{t('settings:appearanceTab')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            data-testid="storage-tab-btn"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'storage'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <HardDrive className="size-3.5" />
            <span>{t('settings:databaseTab')}</span>
          </button>
        </div>
      </div>

      {activeTab === 'storage' ? (
        <SettingsStorageTab />
      ) : (
        <Card className="border-border bg-card shadow-xs overflow-visible">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <Sliders className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">{t('settings:appearance')}</CardTitle>
            </div>
            <CardDescription className="text-xs">{t('settings:appearanceDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSelector />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
