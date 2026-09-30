'use client';

import React, { useMemo } from 'react';
import {
  Search,
  X,
  RotateCcw,
  Shield,
  Users,
  Building2,
  UserCheck,
  User,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FacetedFilter, FacetedOption } from '@/components/ui/faceted-filter';
import { useLanguage } from '@/contexts/LanguageContext';

interface UsersTableToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedRole: string;
  onSelectRole: (role: string) => void;
  selectedOrgRole: 'ALL' | 'OWNERS' | 'MEMBERS';
  onSelectOrgRole: (orgRole: 'ALL' | 'OWNERS' | 'MEMBERS') => void;
  onResetFilters: () => void;
  isFiltered: boolean;
  totalCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenCreateUser: () => void;
}

export const UsersTableToolbar = React.memo(function UsersTableToolbar({
  search,
  onSearchChange,
  selectedRole,
  onSelectRole,
  selectedOrgRole,
  onSelectOrgRole,
  onResetFilters,
  isFiltered,
  totalCount,
  isLoading,
  isRefreshing,
  onRefresh,
  onOpenCreateUser,
}: UsersTableToolbarProps) {
  const { t, locale } = useLanguage();

  const roleOptions: FacetedOption[] = useMemo(
    () => [
      { value: 'ALL', label: t('users', 'filter_all_roles') },
      { value: 'ADMIN', label: t('users', 'role_admin'), icon: Shield },
      { value: 'USER', label: t('users', 'role_user'), icon: User },
    ],
    [t],
  );

  const teamOptions: FacetedOption[] = useMemo(
    () => [
      { value: 'ALL', label: t('users', 'filter_team_all') },
      { value: 'OWNERS', label: t('users', 'filter_team_owners'), icon: Building2 },
      { value: 'MEMBERS', label: t('users', 'filter_team_members'), icon: UserCheck },
    ],
    [t],
  );

  const countSuffix = useMemo(() => {
    if (locale === 'uk') {
      const mod10 = totalCount % 10;
      const mod100 = totalCount % 100;
      if (mod10 === 1 && mod100 !== 11) {
        return t('users', 'user_count_one');
      }
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
        return t('users', 'user_count_few') || 'користувачі';
      }
      return t('users', 'user_count_many');
    }
    return totalCount === 1 ? t('users', 'user_count_one') : t('users', 'user_count_many');
  }, [totalCount, locale, t]);

  return (
    <div
      data-testid="users-table-toolbar"
      className="flex flex-wrap items-center justify-between gap-2.5 p-3 border-b border-border/60 bg-card/40"
    >
      {/* Left side: Search input + Faceted Filters + Reset button */}
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
        {/* Compact Search Input */}
        <div className="relative w-full sm:w-64 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/70" />
          <Input
            data-testid="users-search-input"
            type="text"
            placeholder={t('users', 'search_placeholder')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-8 pr-7 text-xs bg-background/80 border-border/80 rounded-md focus-visible:ring-1"
          />
          {search && (
            <button
              type="button"
              data-testid="users-search-clear-btn"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
              title={t('users', 'reset_filters')}
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* System Role Faceted Filter */}
        <FacetedFilter
          title={t('users', 'role_filter_label').replace(':', '')}
          options={roleOptions}
          selectedValue={selectedRole}
          onSelect={onSelectRole}
          icon={Shield}
          dataTestId="users-filter-role"
        />

        {/* Team Role Faceted Filter */}
        <FacetedFilter
          title={t('users', 'team_filter_label').replace(':', '')}
          options={teamOptions}
          selectedValue={selectedOrgRole}
          onSelect={(val) => onSelectOrgRole(val as 'ALL' | 'OWNERS' | 'MEMBERS')}
          icon={Users}
          dataTestId="users-filter-team"
        />

        {/* Instant Reset Filters Button */}
        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-testid="users-reset-filters-btn"
            onClick={onResetFilters}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 font-normal"
          >
            <RotateCcw className="size-3" />
            <span>{t('users', 'reset_filters')}</span>
          </Button>
        )}
      </div>

      {/* Right side: Count Badge & Compact Refresh Button */}
      <div className="flex items-center gap-2 shrink-0">
        <Badge
          data-testid="users-count-badge"
          variant="outline"
          className="h-7 text-xs font-normal border-border/60 bg-background/60 text-muted-foreground px-2.5 rounded-md"
        >
          {totalCount} {countSuffix}
        </Badge>

        <Button
          variant="ghost"
          size="sm"
          data-testid="refresh-users-btn"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md"
          onClick={onRefresh}
          disabled={isRefreshing || isLoading}
          title={t('users', 'refresh_button')}
          aria-label={t('users', 'refresh_button')}
        >
          <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          size="sm"
          data-testid="open-create-user-dialog-btn"
          onClick={onOpenCreateUser}
          className="h-8 gap-1.5 px-3 text-xs rounded-md font-medium shadow-sm transition-all"
        >
          <UserPlus className="size-3.5" />
          <span>{t('users', 'create_user_button')}</span>
        </Button>
      </div>
    </div>
  );
});
