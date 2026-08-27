'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { UserListItemDto } from '@smartfeed/shared';
import { Users, Search, Building2, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { UserRowActions } from './UserRowActions';

interface TeamMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerUser: UserListItemDto | null;
  onStatusChange: (id: string, newActive: boolean) => Promise<void>;
  onOpenDelete: (user: UserListItemDto) => void;
}

export function TeamMembersDialog({
  open,
  onOpenChange,
  ownerUser,
  onStatusChange,
  onOpenDelete,
}: TeamMembersDialogProps) {
  const { t, locale } = useLanguage();
  const isUk = locale === 'uk';
  const [searchTerm, setSearchTerm] = useState('');

  const companyName = ownerUser?.organization?.organizationName || 'Компанія';
  const members = ownerUser?.teamMembers || [];

  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return members;
    const term = searchTerm.toLowerCase().trim();
    return members.filter(
      (m) =>
        m.email.toLowerCase().includes(term) ||
        (m.fullName && m.fullName.toLowerCase().includes(term)),
    );
  }, [members, searchTerm]);

  if (!ownerUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid={`team-members-modal-${ownerUser.id}`}
        className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-6"
      >
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2.5 text-foreground mb-1">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Users className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {t('users', 'team_dialog_title')} «{companyName}»
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Building2 className="size-3 text-amber-500" />
                  {ownerUser.fullName || ownerUser.email}
                </span>{' '}
                • {t('users', 'team_dialog_plan')}:{' '}
                <span className="font-semibold text-primary">
                  {ownerUser.license?.planType || 'FREE'}
                </span>{' '}
                • {members.length}{' '}
                {members.length === 1
                  ? t('users', 'user_count_one')
                  : t('users', 'user_count_many')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search bar inside dialog */}
        <div className="pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              data-testid="team-modal-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('users', 'team_search_placeholder')}
              className="pl-8 h-9 text-xs"
            />
          </div>
        </div>

        {/* Members Table */}
        <div className="flex-1 overflow-y-auto border border-border rounded-lg">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">{t('users', 'col_user')}</TableHead>
                <TableHead className="text-xs">{t('users', 'col_status')}</TableHead>
                <TableHead className="text-xs">{t('users', 'col_created')}</TableHead>
                <TableHead className="text-xs text-right w-[60px]">
                  {t('users', 'col_actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-xs">
                    {members.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <Users className="size-6 opacity-40 text-muted-foreground" />
                        <span>{t('users', 'team_empty_members')}</span>
                      </div>
                    ) : (
                      <span>{t('users', 'empty_users_desc')}</span>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => {
                  const isActive = member.isActive !== false;
                  return (
                    <TableRow
                      key={member.id}
                      data-testid={`team-modal-row-${member.id}`}
                      className="hover:bg-muted/30"
                    >
                      <TableCell className="py-2.5">
                        <div className="flex items-center space-x-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                            {member.fullName
                              ? member.fullName.substring(0, 2)
                              : member.email.substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-xs text-foreground truncate">
                              {member.fullName || t('users', 'unnamed_user')}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate font-mono">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-2.5">
                        <Badge
                          variant="outline"
                          className={
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] h-5'
                              : 'bg-destructive/10 text-destructive border-destructive/20 text-[10px] h-5'
                          }
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                              isActive ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'
                            }`}
                          />
                          {isActive ? t('users', 'status_active') : t('users', 'status_suspended')}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-2.5 text-xs text-muted-foreground">
                        {new Date(member.createdAt).toLocaleDateString(
                          locale === 'uk' ? 'uk-UA' : 'en-US',
                          {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          },
                        )}
                      </TableCell>

                      <TableCell className="py-2.5 text-right">
                        <UserRowActions
                          user={member}
                          onStatusChange={onStatusChange}
                          onOpenDelete={onOpenDelete}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="pt-3 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="team-modal-close-btn"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            {t('users', 'btn_close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
