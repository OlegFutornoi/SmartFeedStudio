import { z } from 'zod';
import { MemberRole } from '../enums/index.js';

export const OrganizationMemberDtoSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  userEmail: z.string().email(),
  userFullName: z.string().nullable().optional(),
  role: z.nativeEnum(MemberRole),
  joinedAt: z.union([z.date(), z.string()]),
});

export type OrganizationMemberDto = z.infer<typeof OrganizationMemberDtoSchema>;

export const OrganizationDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string().nullable().optional(),
  ownerId: z.string().uuid(),
  maxTeamSeats: z.number().int().nonnegative(),
  usedTeamSeats: z.number().int().nonnegative(),
  members: z.array(OrganizationMemberDtoSchema).optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type OrganizationDto = z.infer<typeof OrganizationDtoSchema>;

export const InviteMemberDtoSchema = z.object({
  email: z.string().email('Invalid email address format'),
  role: z.nativeEnum(MemberRole).default(MemberRole.MEMBER).optional(),
});

export type InviteMemberDto = z.infer<typeof InviteMemberDtoSchema>;

export const UpdateOrganizationDtoSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
});

export type UpdateOrganizationDto = z.infer<typeof UpdateOrganizationDtoSchema>;
