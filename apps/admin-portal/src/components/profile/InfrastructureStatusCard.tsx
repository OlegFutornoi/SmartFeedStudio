'use client';

import React from 'react';
import { Server, Database, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../contexts/LanguageContext';

export const InfrastructureStatusCard = React.memo(function InfrastructureStatusCard() {
  const { t } = useLanguage();

  return (
    <Card
      data-testid="infrastructure-status-card"
      className="border-border/80 bg-card/60 backdrop-blur-sm shadow-md"
    >
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{t('settings', 'infra_title')}</CardTitle>
            <CardDescription>{t('settings', 'infra_desc')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center space-x-2.5 text-sm">
            <Database className="h-4 w-4 text-emerald-400" />
            <span className="font-medium">PostgreSQL 16</span>
          </div>
          <Badge
            data-testid="infra-badge-postgres"
            variant="outline"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs"
          >
            {t('settings', 'connected')}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center space-x-2.5 text-sm">
            <Server className="h-4 w-4 text-emerald-400" />
            <span className="font-medium">Redis 7 (BullMQ)</span>
          </div>
          <Badge
            data-testid="infra-badge-redis"
            variant="outline"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs"
          >
            {t('settings', 'connected')}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center space-x-2.5 text-sm">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span className="font-medium">S3 / MinIO Cloud Storage</span>
          </div>
          <Badge
            data-testid="infra-badge-s3"
            variant="outline"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs"
          >
            {t('settings', 'connected')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
});
