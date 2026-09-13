import React, { useState } from 'react';
import { Mail, Clock, Copy, Check, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/i18n';

import type { OrganizationInvitationDto } from '@smartfeed/shared';

interface PendingInvitationsListProps {
  invitations: OrganizationInvitationDto[];
  onRevoke: (invitationId: string) => Promise<void>;
  isCurrentUserOwnerOrAdmin: boolean;
}

export const PendingInvitationsList: React.FC<PendingInvitationsListProps> = ({
  invitations,
  onRevoke,
  isCurrentUserOwnerOrAdmin,
}) => {
  const { t } = useTranslation(['team', 'common']);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  if (!invitations || invitations.length === 0) {
    return null;
  }

  const handleCopy = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (e) {
      console.warn('[PendingInvitationsList:handleCopy] Failed to copy invitation URL:', e);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      await onRevoke(id);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Card className="border-border bg-card shadow-sm" data-testid="pending-invitations-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>{t('team.pendingInvitationsTitle')}</span>
            </CardTitle>
            <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">
              {invitations.length}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs">{t('team.pendingInvitationsDesc')}</CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="divide-y divide-border/50 rounded-xl border border-border/60 overflow-hidden">
          {invitations.map((inv) => {
            const isCopied = copiedId === inv.id;
            const isRevoking = revokingId === inv.id;
            const formattedDate = new Date(inv.expiresAt).toLocaleDateString('uk-UA', {
              day: '2-digit',
              month: '2-digit',
            });

            return (
              <div
                key={inv.id}
                data-testid={`pending-invite-row-${inv.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 bg-muted/10 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{inv.email}</span>
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-medium">
                        {inv.role === 'ADMIN' ? t('team.adminRole') : t('team.memberRole')}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t('team.expiresIn', { date: formattedDate })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(inv.id, inv.inviteUrl || '')}
                    data-testid={`copy-link-btn-${inv.id}`}
                    className="h-8 text-xs gap-1.5 font-medium"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-emerald-500">{t('team.copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>{t('team.copyInviteLink')}</span>
                      </>
                    )}
                  </Button>

                  {isCurrentUserOwnerOrAdmin && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(inv.id)}
                      disabled={isRevoking}
                      data-testid={`revoke-invite-btn-${inv.id}`}
                      className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      {isRevoking ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
