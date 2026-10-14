import { useNavigate } from 'react-router-dom';
import { CloudLightning, ShieldCheck, Zap } from 'lucide-react';
import { useTranslation } from '@/i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface UpgradeStoragePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOverQuota?: boolean;
}

export function UpgradeStoragePromptDialog({
  open,
  onOpenChange,
  isOverQuota = false,
}: UpgradeStoragePromptDialogProps) {
  const { t } = useTranslation(['storage', 'common']);
  const navigate = useNavigate();

  const handleUpgradeClick = () => {
    onOpenChange(false);
    navigate('/plans');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="upgrade-storage-dialog"
        className="sm:max-w-[480px] p-0 overflow-hidden bg-card border-border shadow-xl"
      >
        <DialogHeader className="p-6 pb-4 bg-card border-b border-border text-left">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <CloudLightning className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {t('storage:upgradePromptTitle')}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isOverQuota ? t('storage:upgradeQuotaDesc') : t('storage:upgradePromptDesc')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Feature Benefits List */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5 text-muted-foreground">
              <Zap className="size-4 text-primary shrink-0 mt-0.5" />
              <span>{t('storage:cdnFeatureBenefit')}</span>
            </div>
            <div className="flex items-start gap-2.5 text-muted-foreground">
              <ShieldCheck className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{t('storage:zeroEgressBenefit')}</span>
            </div>
            <div className="flex items-start gap-2.5 text-muted-foreground">
              <CloudLightning className="size-4 text-primary shrink-0 mt-0.5" />
              <span>{t('storage:backupBenefit')}</span>
            </div>
          </div>

          {/* Plan Comparison Card */}
          <div className="p-3.5 rounded-lg bg-muted/40 border border-border/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('storage:recommendedPlan')}
              </p>
              <p className="text-xs font-semibold text-foreground mt-0.5">
                {t('storage:planProDesc')}
              </p>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              10 GB
            </span>
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/20 border-t border-border flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            data-testid="upgrade-storage-cancel-btn"
          >
            {t('common:cancel')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleUpgradeClick}
            data-testid="upgrade-storage-confirm-btn"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            {t('storage:upgradeNow')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
