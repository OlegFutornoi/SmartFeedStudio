import { z } from 'zod';
import { Role, PlanType } from '../enums/index.js';

export interface UserLicenseSummary {
  licenseKey: string;
  planType: PlanType;
  isActive: boolean;
  maxXmlLimit: number;
  aiCredits: number;
}

export interface UserOrganizationSummary {
  organizationId: string;
  organizationName: string;
  memberRole: 'OWNER' | 'ADMIN' | 'MEMBER';
  isOwner: boolean;
  ownerEmail?: string | null;
  ownerFullName?: string | null;
}

export interface UserListItemDto {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  isActive?: boolean;
  license?: UserLicenseSummary | null;
  organization?: UserOrganizationSummary | null;
  membersCount?: number;
  teamMembers?: UserListItemDto[];
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export const UpdateUserStatusDtoSchema = z.object({
  isActive: z.boolean(),
});

export type UpdateUserStatusDto = z.infer<typeof UpdateUserStatusDtoSchema>;

export interface UsersStatsDto {
  totalUsers: number;
  activeLicenses: number;
  superAdminsCount: number;
  standardUsersCount: number;
}

export const UsersQueryDtoSchema = z.object({
  search: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  orgRoleFilter: z.enum(['ALL', 'OWNERS', 'MEMBERS']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().min(0).default(0).optional(),
});

export type UsersQueryDto = z.infer<typeof UsersQueryDtoSchema>;

export enum AccountType {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
}

export const CreateUserByAdminDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.nativeEnum(Role).default(Role.USER),
  accountType: z.nativeEnum(AccountType).default(AccountType.OWNER),
  companyName: z.string().optional(),
  organizationId: z.string().optional(),
  planCode: z.nativeEnum(PlanType).optional(),
});

export type CreateUserByAdminDto = z.infer<typeof CreateUserByAdminDtoSchema>;
