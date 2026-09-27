import { z } from 'zod';
import { Role, MemberRole } from '../enums/index.js';

export const RegisterDtoSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  companyName: z.string().min(2, 'Company name must be at least 2 characters').optional(),
  role: z.nativeEnum(Role).default(Role.USER).optional(),
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
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>;

export const ForgotPasswordDtoSchema = z.object({
  email: z.string().email('Invalid email address format'),
});

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDtoSchema>;

export const ResetPasswordDtoSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
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
