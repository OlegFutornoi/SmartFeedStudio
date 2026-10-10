import React from 'react';
import { Building2, Pencil, Crown, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

interface TeamHeaderProps {
  organizationName: string;
  ownerName?: string | null;
  ownerEmail?: string;
  planType?: string;
  isExpired?: boolean;
  daysRemaining?: number | null;
  canEditName?: boolean;
  onOpenEditName: () => void;
}

export const TeamHeader: React.FC<TeamHeaderProps> = ({
  organizationName,
  ownerName,
  ownerEmail,
  planType = 'STARTER',
  isExpired = false,
  daysRemaining,
  canEditName = false,
  onOpenEditName,
}) => {
  const { t } = useTranslation(['team', 'common']);

  const getPlanBadgeColor = (plan: string) => {
    switch (plan.toUpperCase()) {
      case 'ENTERPRISE':
        return 'bg-foreground text-background hover:bg-foreground/90 border-foreground';
      case 'PRO':
        return 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary';
      case 'GROWTH':
        return 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80';
      default:
        return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  return (
    <div
      className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-border/40"
      data-testid="team-header"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/80 text-foreground border border-border/80 shadow-xs shrink-0">
          <Building2 className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1
              data-testid="company-title"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              {organizationName}
            </h1>
            {canEditName && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenEditName}
                data-testid="edit-company-name-btn"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title={t('team.editCompanyName')}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            <Badge
              variant="default"
              data-testid="team-plan-badge"
              className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 shadow-sm ${getPlanBadgeColor(planType)}`}
            >
              {planType === 'ENTERPRISE' && (
                <Crown className="h-3 w-3 mr-1 inline-block text-background" />
              )}
              <span>{planType}</span>
            </Badge>

            {isExpired ? (
              <Badge variant="destructive" className="text-[10px] font-medium gap-1">
                <ShieldAlert className="h-3 w-3" />
                <span>Термін вичерпано</span>
              </Badge>
            ) : daysRemaining !== null && daysRemaining !== undefined ? (
              <span className="text-[11px] text-muted-foreground font-mono">
                {t('team.daysRemaining', { count: daysRemaining })}
              </span>
            ) : null}
          </div>

          {(ownerName || ownerEmail) && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <span>{t('team.companyOwner')}:</span>
              <span className="font-semibold text-foreground">
                {ownerName ? `${ownerName} (${ownerEmail})` : ownerEmail}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
