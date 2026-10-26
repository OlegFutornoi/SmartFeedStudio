import { z } from 'zod';

export const AuthTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().positive(),
});

export const UserOrganizationInfoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
});

export const UserProfileSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().nullable().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER']),
  avatarUrl: z.string().nullable().optional(),
  organization: UserOrganizationInfoSchema.nullable().optional(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

export const AuthResponseSchema = z.object({
  user: UserProfileSchema,
  tokens: AuthTokensSchema,
});

export const UserLicenseSummarySchema = z.object({
  licenseKey: z.string().min(1),
  planType: z.string().min(1),
  isActive: z.boolean(),
  maxXmlLimit: z.number(),
  aiCredits: z.number(),
});

export const UserOrganizationSummarySchema = z.object({
  organizationId: z.string().min(1),
  organizationName: z.string().min(1),
  memberRole: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
  isOwner: z.boolean(),
  ownerEmail: z.string().nullable().optional(),
  ownerFullName: z.string().nullable().optional(),
  ownerAvatarUrl: z.string().nullable().optional(),
});

export const UserListItemSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().nullable().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER']),
  avatarUrl: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  license: UserLicenseSummarySchema.nullable().optional(),
  organization: UserOrganizationSummarySchema.nullable().optional(),
  membersCount: z.number().optional(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

export const UsersListResponseSchema = z.array(UserListItemSchema);

export const UsersStatsSchema = z.object({
  totalUsers: z.number().nonnegative(),
  activeLicenses: z.number().nonnegative(),
  superAdminsCount: z.number().nonnegative(),
  standardUsersCount: z.number().nonnegative(),
});

export const DashboardOverviewSchema = z.object({
  stats: UsersStatsSchema,
  paymentStats: z.any().nullable().optional(),
  recentUsers: z.array(UserListItemSchema),
  recentTransactions: z.array(z.any()).optional(),
  recentLicenses: z.array(z.any()).optional(),
});
