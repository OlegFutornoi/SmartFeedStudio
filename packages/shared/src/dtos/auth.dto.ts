import { z } from 'zod';
import { Role, MemberRole } from '../enums/index.js';
import type { LicenseEntity } from '../contracts/cqrs.js';
import type { UserQuotasDto } from './license.dto.js';
import type { NavigationItemDto } from './navigation.dto.js';

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
export const PASSWORD_COMPLEXITY_MESSAGE =
  'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number';

export const FULL_NAME_REGEX = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\s'\u2019-]+$/u;
export const FULL_NAME_MESSAGE =
  'Full name can only contain letters, spaces, hyphens, and apostrophes';

export const RegisterDtoSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(PASSWORD_REGEX, PASSWORD_COMPLEXITY_MESSAGE),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .regex(FULL_NAME_REGEX, FULL_NAME_MESSAGE)
    .optional(),
  companyName: z.string().min(2, 'Company name must be at least 2 characters').optional(),
});

export type RegisterDto = z.infer<typeof RegisterDtoSchema>;

export const LoginDtoSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginDto = z.infer<typeof LoginDtoSchema>;

export const RefreshTokenDtoSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenDtoSchema>;

export const ChangePasswordDtoSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(PASSWORD_REGEX, PASSWORD_COMPLEXITY_MESSAGE),
});

export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>;

export const ForgotPasswordDtoSchema = z.object({
  email: z.string().email('Invalid email address format'),
});

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDtoSchema>;

export const ResetPasswordDtoSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(PASSWORD_REGEX, PASSWORD_COMPLEXITY_MESSAGE),
});

export type ResetPasswordDto = z.infer<typeof ResetPasswordDtoSchema>;

export const UpdateAvatarDtoSchema = z.object({
  avatarUrl: z.string().max(3000000).nullable().optional(),
});

export type UpdateAvatarDto = z.infer<typeof UpdateAvatarDtoSchema>;

export interface ForgotPasswordResponseDto {
  success: boolean;
  message: string;
  resetToken?: string;
}

export interface ResetPasswordResponseDto {
  success: boolean;
  message: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface UserOrganizationInfo {
  id: string;
  name: string;
  role: MemberRole;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  avatarUrl?: string | null;
  isActive?: boolean;
  organization?: UserOrganizationInfo | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface AuthResponseDto {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface BootstrapResponseDto {
  user: UserProfile;
  license: LicenseEntity | null;
  quotas: UserQuotasDto | null;
  activeJobsCount: number;
  navigation: NavigationItemDto[];
}
