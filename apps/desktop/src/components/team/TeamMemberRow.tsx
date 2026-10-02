import React from 'react';
import { Trash2, Crown, Shield, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

import type { OrganizationMemberDto } from '@smartfeed/shared';

interface TeamMemberRowProps {
  member: OrganizationMemberDto;
  currentUserId?: string;
  isCurrentUserOwnerOrAdmin: boolean;
  onRemove: (member: OrganizationMemberDto) => void;
}

export const TeamMemberRow: React.FC<TeamMemberRowProps> = ({
  member,
  currentUserId,
  isCurrentUserOwnerOrAdmin,
  onRemove,
}) => {
  const { t } = useTranslation(['team', 'common']);
  const isYou = currentUserId === member.userId;
  const isOwner = member.role === 'OWNER';
  const canRemove = isCurrentUserOwnerOrAdmin && !isOwner && !isYou;

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'US';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return (
          <Badge
            variant="outline"
            className="bg-muted text-foreground border-border text-[10px] gap-1 font-semibold"
          >
            <Crown className="h-3 w-3 text-foreground" />
            <span>{t('team.ownerRole')}</span>
          </Badge>
        );
      case 'ADMIN':
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1 font-semibold">
            <Shield className="h-3 w-3" />
            <span>{t('team.adminRole')}</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[10px] gap-1">
            <User className="h-3 w-3" />
            <span>{t('team.memberRole')}</span>
          </Badge>
        );
    }
  };

  const formattedDate = new Date(member.joinedAt).toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const memberEmail = member.userEmail || (member as unknown as { email?: string }).email || '';
  const memberFullName =
    member.userFullName || (member as unknown as { fullName?: string }).fullName || '';

  return (
    <div
      className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-muted/10 hover:bg-muted/30 transition-colors"
      data-testid="team-member-row"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold border border-primary/30 shrink-0">
          {getInitials(memberFullName, memberEmail)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-foreground truncate">
              {memberFullName || memberEmail.split('@')[0]}
            </span>
            {isYou && (
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 border-primary/40 text-primary"
              >
                {t('team.youBadge')}
              </Badge>
            )}
            {getRoleBadge(member.role)}
          </div>
          <p
            className="text-[11px] text-muted-foreground font-mono truncate mt-0.5"
            data-testid="member-email"
          >
            {memberEmail}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[10px] text-muted-foreground hidden sm:inline-block font-mono">
          {t('team.joinedAt', { date: formattedDate })}
        </span>

        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-testid={`remove-member-btn-${member.id}`}
            onClick={() => onRemove(member)}
            title={t('team.removeMember')}
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};
