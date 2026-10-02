import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, RotateCcw, CheckCircle2, Sparkles, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

export const CloudSyncInteractiveMockup: React.FC = () => {
  const { t } = useTranslation(['featureTeaser', 'common']);
  const navigate = useNavigate();

  const [activeSnapshot, setActiveSnapshot] = useState<number>(1);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const snapshots = [
    {
      id: 1,
      time: '14:25',
      skuCount: '12,450',
      size: '4.8 MB',
      comment: t('featureTeaser.cloudSync.mockup.snapshots.1.comment'),
    },
    {
      id: 2,
      time: '10:10',
      skuCount: '12,410',
      size: '4.7 MB',
      comment: t('featureTeaser.cloudSync.mockup.snapshots.2.comment'),
    },
    {
      id: 3,
      time: '18:30',
      skuCount: '11,980',
      size: '4.5 MB',
      comment: t('featureTeaser.cloudSync.mockup.snapshots.3.comment'),
    },
  ];

  return (
    <div
      data-testid="interactive-cloud-mockup"
      className="space-y-4 rounded-xl border border-border/80 bg-card p-5 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">
              {t('featureTeaser.cloudSync.mockup.title')}
            </h3>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-primary/40 text-primary"
            >
              Sandbox
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('featureTeaser.cloudSync.mockup.subtitle')}
          </p>
        </div>

        <Badge
          variant="secondary"
          className="text-xs px-2.5 py-1 bg-muted text-foreground border border-border self-start sm:self-auto flex items-center gap-1.5"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>S3 Cloud Active</span>
        </Badge>
      </div>

      {/* Snapshot Items */}
      <div className="space-y-2.5">
        {snapshots.map((item) => {
          const isSelected = activeSnapshot === item.id;

          return (
            <div
              key={item.id}
              onClick={() => setActiveSnapshot(item.id)}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border transition-all cursor-pointer gap-2 ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-xs'
                  : 'border-border/60 bg-muted/20 hover:border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Cloud className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <span>
                      {t('featureTeaser.cloudSync.mockup.snapshotTitle', {
                        id: item.id.toString(),
                      })}
                    </span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      ({item.time})
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{item.comment}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-between sm:justify-end">
                <div className="text-right">
                  <div className="text-[11px] font-semibold text-foreground">
                    {item.skuCount} SKU
                  </div>
                  <div className="text-[10px] text-muted-foreground">{item.size}</div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={isSelected ? 'default' : 'outline'}
                  data-testid={`mockup-rollback-btn-${item.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUpgradeModal(true);
                  }}
                  className="text-xs h-7 gap-1 font-medium shadow-xs"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>{t('featureTeaser.cloudSync.mockup.rollbackBtn')}</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showUpgradeModal && (
        <div
          data-testid="mockup-cloud-upgrade-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50 duration-200"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  {t('featureTeaser.common.lockedBadge', { plan: 'GROWTH / PRO' })}
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
              {t('featureTeaser.cloudSync.heroSubtitle')}
            </p>

            <div className="space-y-2 py-2">
              <div className="flex items-center gap-2 text-xs text-foreground">
                <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                <span>{t('featureTeaser.cloudSync.dialog.benefit1')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground">
                <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                <span>{t('featureTeaser.cloudSync.dialog.benefit2')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                data-testid="mockup-cloud-confirm-upgrade-btn"
                onClick={() => {
                  setShowUpgradeModal(false);
                  navigate('/plans?highlight=GROWTH');
                }}
                className="flex-1 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
              >
                {t('featureTeaser.cloudSync.cta.button')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUpgradeModal(false)}
                className="text-xs font-medium"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
