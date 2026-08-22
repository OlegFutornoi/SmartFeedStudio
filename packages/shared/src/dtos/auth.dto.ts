import { z } from 'zod';
import { Role } from '../enums/index.js';

export const RegisterDtoSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
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
