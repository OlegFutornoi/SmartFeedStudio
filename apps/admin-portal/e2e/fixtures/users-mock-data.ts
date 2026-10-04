import { UserListItemDto, Role, PlanType } from '@smartfeed/shared';

export const memberUser: UserListItemDto = {
  id: 'usr-2',
  email: 'manager@smartfeed.studio',
  fullName: 'Менеджер Продажів',
  role: Role.USER,
  isActive: true,
  organization: {
    organizationId: 'org-1',
    organizationName: 'SmartFeed HQ',
    memberRole: 'MEMBER',
    isOwner: false,
    ownerEmail: 'client@shop.ua',
    ownerFullName: 'Петро Клієнт',
  },
  createdAt: '2026-02-15T10:30:00.000Z',
  license: {
    licenseKey: 'SF-PRO-DEMO-0002',
    planType: PlanType.PRO,
    maxXmlLimit: 50000,
    aiCredits: 500,
    isActive: true,
  },
};

export const ownerUser: UserListItemDto = {
  id: 'usr-3',
  email: 'client@shop.ua',
  fullName: 'Петро Клієнт',
  role: Role.USER,
  isActive: true,
  organization: {
    organizationId: 'org-1',
    organizationName: 'SmartFeed HQ',
    memberRole: 'OWNER',
    isOwner: true,
  },
  membersCount: 1,
  teamMembers: [memberUser],
  createdAt: '2026-03-20T14:00:00.000Z',
  license: {
    licenseKey: 'SF-GROWTH-0003',
    planType: PlanType.GROWTH,
    maxXmlLimit: 10000,
    aiCredits: 100,
    isActive: true,
  },
};

export const adminUser: UserListItemDto = {
  id: 'usr-1',
  email: 'admin1@smartfeed.studio',
  fullName: 'Головний Адміністратор',
  role: Role.ADMIN,
  isActive: true,
  organization: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  license: null,
};
