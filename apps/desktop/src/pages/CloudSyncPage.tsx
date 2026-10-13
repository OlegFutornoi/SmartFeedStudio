import { Images, Folder, Database, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/i18n';
import { useLicense } from '@/hooks/useLicense';
import { ExpiredPlanBlocker } from '@/components/layout/ExpiredPlanBlocker';
import { StorageQuotaBar } from '@/components/storage/StorageQuotaBar';
import { MediaSyncTab } from '@/components/cloud/MediaSyncTab';
import { CloudFilesBrowserTab } from '@/components/cloud/CloudFilesBrowserTab';
import { CloudBackupsTab } from '@/components/cloud/CloudBackupsTab';
import { StorageSettingsTab } from '@/components/cloud/StorageSettingsTab';

export function CloudSyncPage() {
  const { t } = useTranslation(['cloud', 'common']);
  const { isExpired } = useLicense();

  if (isExpired) {
    return <ExpiredPlanBlocker featureName={t('cloud:title')} />;
  }

  return (
    <div
      data-testid="cloud-sync-page"
      className="max-w-6xl mx-auto space-y-3.5 animate-in fade-in duration-300"
    >
      {/* Live Cloudflare R2 Quota Widget */}
      <StorageQuotaBar variant="full" />

      {/* Main Tabs Container */}
      <Tabs defaultValue="media" className="w-full space-y-4">
        <TabsList className="bg-muted/50 p-1 border border-border/80 h-9">
          <TabsTrigger
            value="media"
            data-testid="cloud-tab-media"
            className="text-xs gap-1.5 data-[state=active]:bg-card"
          >
            <Images className="h-3.5 w-3.5" />
            <span>{t('cloud:tabMedia')}</span>
          </TabsTrigger>
          <TabsTrigger
            value="files"
            data-testid="cloud-tab-files"
            className="text-xs gap-1.5 data-[state=active]:bg-card"
          >
            <Folder className="h-3.5 w-3.5" />
            <span>{t('cloud:tabFiles')}</span>
          </TabsTrigger>
          <TabsTrigger
            value="backups"
            data-testid="cloud-tab-backups"
            className="text-xs gap-1.5 data-[state=active]:bg-card"
          >
            <Database className="h-3.5 w-3.5" />
            <span>{t('cloud:tabBackups')}</span>
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            data-testid="cloud-tab-settings"
            className="text-xs gap-1.5 data-[state=active]:bg-card"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>{t('cloud:tabSettings')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="media" className="mt-0 focus-visible:outline-hidden">
          <MediaSyncTab />
        </TabsContent>

        <TabsContent value="files" className="mt-0 focus-visible:outline-hidden">
          <CloudFilesBrowserTab />
        </TabsContent>

        <TabsContent value="backups" className="mt-0 focus-visible:outline-hidden">
          <CloudBackupsTab />
        </TabsContent>

        <TabsContent value="settings" className="mt-0 focus-visible:outline-hidden">
          <StorageSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
