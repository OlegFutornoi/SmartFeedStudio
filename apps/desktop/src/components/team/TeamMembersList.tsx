import React from 'react';
import { Users, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import { TeamMemberRow } from './TeamMemberRow';

import type { OrganizationMemberDto } from '@smartfeed/shared';

interface TeamMembersListProps {
  members: OrganizationMemberDto[];
  currentUserId?: string;
  isCurrentUserOwnerOrAdmin: boolean;
  onRemove: (member: OrganizationMemberDto) => void;
  isLoading?: boolean;
}

export const TeamMembersList: React.FC<TeamMembersListProps> = ({
  members,
  currentUserId,
  isCurrentUserOwnerOrAdmin,
  onRemove,
  isLoading = false,
}) => {
  const { t } = useTranslation(['team', 'common']);

  return (
    <Card className="border-border bg-card shadow-sm" data-testid="team-members-list">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">{t('team.membersTitle')}</CardTitle>
          </div>
          <Badge
            variant="secondary"
            className="text-[10px] font-mono"
            data-testid="members-count-badge"
          >
            {t('team.membersCount', { count: members.length })}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Усі користувачі, які мають доступ до спільних каталогів, фідів та інструментів
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex h-32 w-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : members.length === 0 ? (
          <div className="flex h-24 w-full items-center justify-center text-xs text-muted-foreground">
            {t('team.emptyMembers')}
          </div>
        ) : (
          <div className="space-y-2.5">
            {members.map((member) => (
              <TeamMemberRow
                key={member.id}
                member={member}
                currentUserId={currentUserId}
                isCurrentUserOwnerOrAdmin={isCurrentUserOwnerOrAdmin}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
