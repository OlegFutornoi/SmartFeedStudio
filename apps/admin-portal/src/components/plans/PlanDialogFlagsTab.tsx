import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface FeatureFlagItem {
  testId: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  labelUk: string;
  labelEn: string;
}

interface PlanDialogFlagsTabProps {
  isUk: boolean;
  canCloudBackup: boolean;
  setCanCloudBackup: (v: boolean) => void;
  hasApiAccess: boolean;
  setHasApiAccess: (v: boolean) => void;
  hasFeedDiff: boolean;
  setHasFeedDiff: (v: boolean) => void;
  hasWebhooks: boolean;
  setHasWebhooks: (v: boolean) => void;
  hasCustomS3: boolean;
  setHasCustomS3: (v: boolean) => void;
  hasAuditLog: boolean;
  setHasAuditLog: (v: boolean) => void;
  hasWhiteLabel: boolean;
  setHasWhiteLabel: (v: boolean) => void;
  hasPriorityAi: boolean;
  setHasPriorityAi: (v: boolean) => void;
  slaUptimePercent: string;
  setSlaUptimePercent: (v: string) => void;
}

const FLAG_ITEMS: Omit<FeatureFlagItem, 'checked' | 'onChange'>[] = [
  { testId: 'plan-cloud-backup-checkbox', labelUk: 'Хмарний бекап S3', labelEn: 'S3 Cloud Backup' },
  { testId: 'plan-api-access-checkbox', labelUk: 'REST API доступ', labelEn: 'REST API Access' },
  {
    testId: 'plan-feed-diff-checkbox',
    labelUk: 'Порівняння версій (Diff)',
    labelEn: 'Feed Version Diff',
  },
  {
    testId: 'plan-webhooks-checkbox',
    labelUk: 'Webhooks сповіщення',
    labelEn: 'Webhook Notifications',
  },
  {
    testId: 'plan-custom-s3-checkbox',
    labelUk: 'Власний S3 (BYOS)',
    labelEn: 'Custom S3 Storage (BYOS)',
  },
  { testId: 'plan-audit-log-checkbox', labelUk: 'Журнал аудиту дій', labelEn: 'Team Audit Log' },
  {
    testId: 'plan-white-label-checkbox',
    labelUk: 'White-label PDF звіти',
    labelEn: 'White-label Client Reports',
  },
  {
    testId: 'plan-priority-ai-checkbox',
    labelUk: 'Пріоритетна черга AI',
    labelEn: 'Priority AI Queue',
  },
];

export function PlanDialogFlagsTab({
  isUk,
  canCloudBackup,
  setCanCloudBackup,
  hasApiAccess,
  setHasApiAccess,
  hasFeedDiff,
  setHasFeedDiff,
  hasWebhooks,
  setHasWebhooks,
  hasCustomS3,
  setHasCustomS3,
  hasAuditLog,
  setHasAuditLog,
  hasWhiteLabel,
  setHasWhiteLabel,
  hasPriorityAi,
  setHasPriorityAi,
  slaUptimePercent,
  setSlaUptimePercent,
}: PlanDialogFlagsTabProps) {
  const flagValues: boolean[] = [
    canCloudBackup,
    hasApiAccess,
    hasFeedDiff,
    hasWebhooks,
    hasCustomS3,
    hasAuditLog,
    hasWhiteLabel,
    hasPriorityAi,
  ];

  const flagSetters: ((v: boolean) => void)[] = [
    setCanCloudBackup,
    setHasApiAccess,
    setHasFeedDiff,
    setHasWebhooks,
    setHasCustomS3,
    setHasAuditLog,
    setHasWhiteLabel,
    setHasPriorityAi,
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {FLAG_ITEMS.map((item, idx) => (
        <label
          key={item.testId}
          className="flex items-center gap-2 p-2 rounded-md border border-border bg-secondary/20 cursor-pointer text-xs"
        >
          <input
            type="checkbox"
            data-testid={item.testId}
            checked={flagValues[idx]}
            onChange={(e) => flagSetters[idx](e.target.checked)}
            className="rounded border-border"
          />
          <span>{isUk ? item.labelUk : item.labelEn}</span>
        </label>
      ))}

      <div className="col-span-2 flex flex-col gap-1.5 pt-1">
        <Label className="text-xs">{isUk ? 'SLA Uptime (%)' : 'SLA Uptime (%)'}</Label>
        <Input
          type="number"
          step="0.1"
          min="0"
          max="100"
          data-testid="plan-sla-uptime-input"
          value={slaUptimePercent}
          onChange={(e) => setSlaUptimePercent(e.target.value)}
          placeholder="99.9"
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}
