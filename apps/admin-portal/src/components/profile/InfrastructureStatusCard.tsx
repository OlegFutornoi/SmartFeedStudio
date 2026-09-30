'use client';

import React from 'react';
import { Server, Database, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

export const InfrastructureStatusCard = React.memo(function InfrastructureStatusCard() {
  const { t } = useLanguage();

  return (
    <Card
      data-testid="infrastructure-status-card"
      className="border-border/80 bg-card/60 backdrop-blur-sm shadow-md"
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Server className="size-4 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">{t('settings', 'infra_title')}</CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          {t('settings', 'infra_desc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center space-x-2.5 text-sm">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">PostgreSQL 16</span>
          </div>
          <Badge
            data-testid="infra-badge-postgres"
            variant="outline"
            className="border-border text-foreground font-normal text-xs gap-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>{t('settings', 'connected')}</span>
          </Badge>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center space-x-2.5 text-sm">
            <Server className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Redis 7 (BullMQ)</span>
          </div>
          <Badge
            data-testid="infra-badge-redis"
            variant="outline"
            className="border-border text-foreground font-normal text-xs gap-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>{t('settings', 'connected')}</span>
          </Badge>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center space-x-2.5 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">S3 / MinIO Cloud Storage</span>
          </div>
          <Badge
            data-testid="infra-badge-s3"
            variant="outline"
            className="border-border text-foreground font-normal text-xs gap-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>{t('settings', 'connected')}</span>
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
});
