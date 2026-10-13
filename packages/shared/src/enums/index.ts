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

export enum FeedSourceType {
  URL = 'URL',
  FILE = 'FILE',
}

export enum FeedFormat {
  XML_ROZETKA = 'XML_ROZETKA',
  YML_PROM = 'YML_PROM',
  XML_GOOGLE = 'XML_GOOGLE',
  XML_GENERIC = 'XML_GENERIC',
  CSV = 'CSV',
  XLSX = 'XLSX',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  DRAFT = 'DRAFT',
  ARCHIVED = 'ARCHIVED',
}

export enum ImportJobStatus {
  PENDING = 'PENDING',
  DOWNLOADING = 'DOWNLOADING',
  PARSING = 'PARSING',
  MAPPING = 'MAPPING',
  SAVING = 'SAVING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum AuthErrorCode {
  USER_SUSPENDED = 'USER_SUSPENDED',
}

export enum CurrencyCode {
  UAH = 'UAH',
  USD = 'USD',
  EUR = 'EUR',
  PLN = 'PLN',
  GBP = 'GBP',
  CNY = 'CNY',
}

export enum ExchangeRateMode {
  MANUAL = 'MANUAL',
  AUTO_NBU = 'AUTO_NBU',
  AUTO_PRIVAT = 'AUTO_PRIVAT',
  AUTO_ECB = 'AUTO_ECB',
}

export enum PriceRoundingMode {
  NONE = 'NONE',
  NEAREST_INTEGER = 'NEAREST_INTEGER',
  DECIMAL_99 = 'DECIMAL_99',
  DECIMAL_95 = 'DECIMAL_95',
  INTEGER_9 = 'INTEGER_9',
  INTEGER_7 = 'INTEGER_7',
  INTEGER_5 = 'INTEGER_5',
}
