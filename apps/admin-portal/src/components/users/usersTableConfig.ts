import React from 'react';
import { UserListItemDto } from '@smartfeed/shared';
import { ColumnConfig } from '@/hooks/useColumnVisibility';

export type UserColumnId = 'user' | 'role' | 'team' | 'plan' | 'status' | 'created' | 'actions';

export const USER_COLUMNS: ColumnConfig<UserColumnId>[] = [
  { id: 'user', labelUk: 'Користувач', labelEn: 'User', canHide: false, defaultVisible: true },
  { id: 'role', labelUk: 'Роль', labelEn: 'Role', canHide: true, defaultVisible: true },
  {
    id: 'team',
    labelUk: 'Організація / Команда',
    labelEn: 'Organization / Team',
    canHide: true,
    defaultVisible: true,
  },
  {
    id: 'plan',
    labelUk: 'Тарифний план',
    labelEn: 'Plan Tier',
    canHide: true,
    defaultVisible: true,
  },
  { id: 'status', labelUk: 'Статус', labelEn: 'Status', canHide: true, defaultVisible: true },
  {
    id: 'created',
    labelUk: 'Дата реєстрації',
    labelEn: 'Registered Date',
    canHide: true,
    defaultVisible: true,
  },
  { id: 'actions', labelUk: 'Дії', labelEn: 'Actions', canHide: false, defaultVisible: true },
];

import { TranslationNamespace } from '@/i18n/types';

export function useUsersTableFilterState(
  users: UserListItemDto[],
  selectedStatus: string,
  selectedPlan: string,
  t: (ns: TranslationNamespace, key: string) => string,
) {
  const statusOptions = React.useMemo(() => {
    let activeCount = 0;
    let suspendedCount = 0;
    users.forEach((u) => {
      if (u.isActive === false) suspendedCount++;
      else activeCount++;
    });
    return [
      { value: 'ALL', label: t('users', 'filter_status_all'), count: users.length },
      { value: 'ACTIVE', label: t('users', 'status_active'), count: activeCount },
      { value: 'SUSPENDED', label: t('users', 'status_suspended'), count: suspendedCount },
    ];
  }, [users, t]);

  const planOptions = React.useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      const plan = u.license?.planType || 'FREE';
      counts[plan] = (counts[plan] || 0) + 1;
    });
    const knownPlans = ['FREE', 'STARTER', 'GROWTH', 'PRO', 'ENTERPRISE'];
    return [
      { value: 'ALL', label: t('users', 'filter_plan_all'), count: users.length },
      ...knownPlans.map((p) => ({
        value: p,
        label: p,
        count: counts[p] || 0,
      })),
    ];
  }, [users, t]);

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      if (selectedStatus === 'ACTIVE' && u.isActive === false) return false;
      if (selectedStatus === 'SUSPENDED' && u.isActive !== false) return false;
      if (selectedPlan && selectedPlan !== 'ALL') {
        const plan = u.license?.planType || 'FREE';
        if (plan !== selectedPlan) return false;
      }
      return true;
    });
  }, [users, selectedStatus, selectedPlan]);

  const totalUsersCount = React.useMemo(() => {
    const ids = new Set<string>();
    filteredUsers.forEach((u) => {
      ids.add(u.id);
      u.teamMembers?.forEach((m) => ids.add(m.id));
    });
    return ids.size;
  }, [filteredUsers]);

  return { statusOptions, planOptions, filteredUsers, totalUsersCount };
}
