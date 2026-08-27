import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation, getErrorMessage } from '@/i18n';
import {
  getUserOrganizations,
  getOrganizationById,
  inviteOrganizationMember,
  removeOrganizationMember,
  updateOrganization,
  getMyLicense,
  getOrganizationInvitations,
  revokeOrganizationInvitation,
} from '@/lib/api';
import type {
  OrganizationDto,
  OrganizationMemberDto,
  OrganizationInvitationDto,
  LicenseEntity,
} from '@smartfeed/shared';
import { TeamHeader } from '@/components/team/TeamHeader';
import { TeamSeatsQuotaCard } from '@/components/team/TeamSeatsQuotaCard';
import { TeamMembersList } from '@/components/team/TeamMembersList';
import { PendingInvitationsList } from '@/components/team/PendingInvitationsList';
import { InviteMemberDialog } from '@/components/team/InviteMemberDialog';
import { UpgradeTeamSeatsDialog } from '@/components/team/UpgradeTeamSeatsDialog';
import { RemoveMemberDialog } from '@/components/team/RemoveMemberDialog';
import { EditCompanyNameDialog } from '@/components/team/EditCompanyNameDialog';

export const TeamPage: React.FC = () => {
  const { token, user } = useAuth();
  const { t } = useTranslation(['team', 'common', 'errors']);

  const [organization, setOrganization] = useState<OrganizationDto | null>(null);
  const [invitations, setInvitations] = useState<OrganizationInvitationDto[]>([]);
  const [license, setLicense] = useState<LicenseEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dialogs visibility
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<OrganizationMemberDto | null>(null);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);

  const loadData = useCallback(
    async (isInitial = false) => {
      if (!token) return;
      if (isInitial) setIsLoading(true);
      setErrorMessage(null);

      try {
        const [orgs, licenseData] = await Promise.all([
          getUserOrganizations(token),
          getMyLicense(token).catch(() => null),
        ]);

        setLicense(licenseData);

        const targetOrgId =
          Array.isArray(orgs) && orgs.length > 0 ? orgs[0].id : user?.organization?.id;

        if (targetOrgId) {
          const [orgDetails, invs] = await Promise.all([
            getOrganizationById(token, targetOrgId),
            getOrganizationInvitations(token, targetOrgId).catch(() => []),
          ]);
          setOrganization(orgDetails);
          setInvitations(invs);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load organization data';
        setErrorMessage(msg);
      } finally {
        if (isInitial) setIsLoading(false);
      }
    },
    [token, user?.organization?.id],
  );

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const handleInvite = async (email: string, role: string) => {
    if (!token || !organization) return null;
    const res = await inviteOrganizationMember(token, organization.id, { email, role });
    setSuccessMessage(t('team.inviteSuccess'));
    await loadData();
    return res;
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!token || !organization) return;
    try {
      await revokeOrganizationInvitation(token, organization.id, invitationId);
      setSuccessMessage(t('team.revokeSuccess'));
      await loadData();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, t));
    }
  };

  const handleOpenRemoveDialog = (member: OrganizationMemberDto) => {
    setMemberToRemove(member);
    setIsRemoveOpen(true);
  };

  const handleConfirmRemove = async (memberId: string) => {
    if (!token || !organization) return;
    try {
      await removeOrganizationMember(token, organization.id, memberId);
      setSuccessMessage(t('team.removeSuccess'));
      await loadData();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, t));
    }
  };

  const handleUpdateName = async (newName: string) => {
    if (!token || !organization) return;
    try {
      await updateOrganization(token, organization.id, { name: newName });
      setSuccessMessage(t('team.nameUpdatedSuccess'));
      await loadData();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, t));
    }
  };

  const currentMember = organization?.members?.find((m) => m.userId === user?.id);
  const isCurrentUserOwnerOrAdmin =
    (organization as any)?.currentUserRole === 'OWNER' ||
    (organization as any)?.currentUserRole === 'ADMIN' ||
    organization?.ownerId === user?.id ||
    currentMember?.role === 'OWNER' ||
    currentMember?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN';

  const usedSeats = organization?.usedTeamSeats ?? organization?.members?.length ?? 1;
  const maxSeats = organization?.maxTeamSeats || license?.maxTeamSeats || 1;
  const planType = (organization as any)?.activePlan || license?.planType || 'STARTER';
  const members = organization?.members || [];
  const remainingSeats = Math.max(0, maxSeats - usedSeats);

  return (
    <div
      className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in-50 duration-300"
      data-testid="team-page"
    >
      {/* Success Alert */}
      {successMessage && (
        <div
          data-testid="team-success-alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs hover:underline opacity-80"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div
          data-testid="team-error-alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-destructive text-xs font-medium"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs hover:underline opacity-80"
          >
            ✕
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Header */}
          <TeamHeader
            organizationName={organization?.name || user?.organization?.name || 'Моя Компанія'}
            ownerName={user?.fullName}
            ownerEmail={user?.email}
            planType={planType}
            isExpired={license?.isExpired}
            daysRemaining={license?.daysRemaining}
            canEditName={isCurrentUserOwnerOrAdmin}
            onOpenEditName={() => setIsEditNameOpen(true)}
          />

          {/* Quota & Seats Management */}
          <TeamSeatsQuotaCard
            usedSeats={usedSeats}
            maxSeats={maxSeats}
            isOwnerOrAdmin={isCurrentUserOwnerOrAdmin}
            onOpenInvite={() => setIsInviteOpen(true)}
            onOpenUpgrade={() => setIsUpgradeOpen(true)}
          />

          {/* Pending Invitations List */}
          <PendingInvitationsList
            invitations={invitations}
            onRevoke={handleRevokeInvitation}
            isCurrentUserOwnerOrAdmin={isCurrentUserOwnerOrAdmin}
          />

          {/* Members List */}
          <TeamMembersList
            members={members}
            currentUserId={user?.id}
            isCurrentUserOwnerOrAdmin={isCurrentUserOwnerOrAdmin}
            onRemove={handleOpenRemoveDialog}
          />

          {/* Dialogs */}
          <InviteMemberDialog
            isOpen={isInviteOpen}
            onClose={() => setIsInviteOpen(false)}
            onInvite={handleInvite}
            remainingSeats={remainingSeats}
            maxSeats={maxSeats}
          />

          <UpgradeTeamSeatsDialog
            isOpen={isUpgradeOpen}
            onClose={() => setIsUpgradeOpen(false)}
            currentPlan={planType}
            isLimitReached={maxSeats > 1 && usedSeats >= maxSeats}
          />

          <RemoveMemberDialog
            isOpen={isRemoveOpen}
            member={memberToRemove}
            onClose={() => {
              setIsRemoveOpen(false);
              setMemberToRemove(null);
            }}
            onConfirm={handleConfirmRemove}
          />

          <EditCompanyNameDialog
            isOpen={isEditNameOpen}
            initialName={organization?.name || ''}
            onClose={() => setIsEditNameOpen(false)}
            onSave={handleUpdateName}
          />
        </>
      )}
    </div>
  );
};
