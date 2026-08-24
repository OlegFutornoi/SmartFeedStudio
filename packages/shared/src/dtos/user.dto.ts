import { z } from 'zod';
import { Role, PlanType } from '../enums/index.js';

export interface UserLicenseSummary {
  licenseKey: string;
  planType: PlanType;
  isActive: boolean;
  maxXmlLimit: number;
  aiCredits: number;
}

export interface UserListItemDto {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  license?: UserLicenseSummary | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface UsersStatsDto {
  totalUsers: number;
  activeLicenses: number;
  superAdminsCount: number;
  standardUsersCount: number;
}

export const UsersQueryDtoSchema = z.object({
  search: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  limit: z.coerce.number().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().min(0).default(0).optional(),
});

export type UsersQueryDto = z.infer<typeof UsersQueryDtoSchema>;
