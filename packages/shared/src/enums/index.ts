export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum PlanType {
  STARTER = 'STARTER',
  GROWTH = 'GROWTH',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum TargetApp {
  DESKTOP = 'DESKTOP',
  ADMIN_PORTAL = 'ADMIN_PORTAL',
  ALL = 'ALL',
}

export enum MemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentProvider {
  WAYFORPAY = 'WAYFORPAY',
  STRIPE = 'STRIPE',
  MANUAL = 'MANUAL',
}

export enum PaymentInterval {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}
