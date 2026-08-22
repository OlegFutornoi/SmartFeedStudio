import { Role, PlanType } from '../enums/index.js';

// ==========================================
// User Commands & Queries Contracts
// ==========================================

export interface CreateUserCommandPayload {
  email: string;
  passwordHash?: string; // or raw password for handler to hash
  password?: string;
  fullName?: string;
  role?: Role;
}

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetUserByEmailQueryPayload {
  email: string;
}

export interface GetUserByIdQueryPayload {
  id: string;
}

// ==========================================
// User Events Contracts
// ==========================================

export interface UserCreatedEventPayload {
  userId: string;
  email: string;
  fullName: string | null;
  role: Role;
  occurredOn: Date;
}

// ==========================================
// License Contracts
// ==========================================

export interface CreateLicenseCommandPayload {
  userId: string;
  planType?: PlanType;
}

export interface GetLicenseByUserIdQueryPayload {
  userId: string;
}

export interface LicenseEntity {
  id: string;
  userId: string;
  licenseKey: string;
  planType: PlanType;
  canCloudBackup: boolean;
  maxXmlLimit: number;
  aiCredits: number;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Storage Commands Contracts
// ==========================================

export interface GeneratePresignedUploadUrlCommandPayload {
  userId: string;
  fileName: string;
  contentType: string;
  folder?: string;
}

export interface PresignedUploadUrlResult {
  uploadUrl: string;
  s3Key: string;
  publicUrl?: string;
  expiresInSeconds: number;
}
