import { z } from 'zod';
import { MemberRole, InvitationStatus } from '../enums/index.js';

export const OrganizationMemberDtoSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  userEmail: z.string().email(),
  userFullName: z.string().nullable().optional(),
  role: z.nativeEnum(MemberRole),
  joinedAt: z.union([z.date(), z.string()]),
});

export type OrganizationMemberDto = z.infer<typeof OrganizationMemberDtoSchema>;

export const OrganizationInvitationDtoSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  organizationName: z.string().optional(),
  email: z.string().email(),
  role: z.nativeEnum(MemberRole),
  token: z.string(),
  inviteUrl: z.string().optional(),
  status: z.nativeEnum(InvitationStatus),
  invitedById: z.string(),
  invitedByName: z.string().nullable().optional(),
  expiresAt: z.union([z.date(), z.string()]),
  createdAt: z.union([z.date(), z.string()]),
});

export type OrganizationInvitationDto = z.infer<typeof OrganizationInvitationDtoSchema>;

export const OrganizationDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullable().optional(),
  ownerId: z.string(),
  maxTeamSeats: z.number().int().nonnegative(),
  usedTeamSeats: z.number().int().nonnegative(),
  members: z.array(OrganizationMemberDtoSchema).optional(),
  invitations: z.array(OrganizationInvitationDtoSchema).optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type OrganizationDto = z.infer<typeof OrganizationDtoSchema>;

export const InviteMemberDtoSchema = z.object({
  email: z.string().email('Invalid email address format'),
  role: z.nativeEnum(MemberRole).default(MemberRole.MEMBER).optional(),
});

export type InviteMemberDto = z.infer<typeof InviteMemberDtoSchema>;

export const AcceptInvitationDtoSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export type AcceptInvitationDto = z.infer<typeof AcceptInvitationDtoSchema>;

export const InvitationPublicDetailsDtoSchema = z.object({
  token: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(MemberRole),
  organizationName: z.string(),
  inviterName: z.string().nullable().optional(),
  isExistingUser: z.boolean(),
  isValid: z.boolean(),
  expiresAt: z.union([z.date(), z.string()]),
});

export type InvitationPublicDetailsDto = z.infer<typeof InvitationPublicDetailsDtoSchema>;

export const UpdateOrganizationDtoSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
});

export type UpdateOrganizationDto = z.infer<typeof UpdateOrganizationDtoSchema>;
