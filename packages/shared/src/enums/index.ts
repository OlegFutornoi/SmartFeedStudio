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

// Supplier Synchronization Enums (Prom/Rozetka Pattern)
export enum ImageSyncMode {
  DO_NOT_UPDATE = 'DO_NOT_UPDATE',
  ADD_MISSING = 'ADD_MISSING',
  OVERWRITE = 'OVERWRITE',
}

export enum DescriptionSyncMode {
  DO_NOT_UPDATE = 'DO_NOT_UPDATE',
  FILL_EMPTY_ONLY = 'FILL_EMPTY_ONLY',
  OVERWRITE = 'OVERWRITE',
}

export enum AttributesSyncMode {
  DO_NOT_UPDATE = 'DO_NOT_UPDATE',
  ADD_NEW_ONLY = 'ADD_NEW_ONLY',
  OVERWRITE = 'OVERWRITE',
}

export enum TitleSyncMode {
  DO_NOT_UPDATE = 'DO_NOT_UPDATE',
  OVERWRITE = 'OVERWRITE',
}

export enum CategorySyncMode {
  KEEP_MANUAL_MAPPING = 'KEEP_MANUAL_MAPPING',
  OVERWRITE_WITH_FEED = 'OVERWRITE_WITH_FEED',
}

export enum BarcodeSyncMode {
  FILL_EMPTY_ONLY = 'FILL_EMPTY_ONLY',
  DO_NOT_UPDATE = 'DO_NOT_UPDATE',
  OVERWRITE = 'OVERWRITE',
}

export enum SyncPriceSource {
  WHOLESALE = 'WHOLESALE',
  RRP = 'RRP',
  MAX_OF_BOTH = 'MAX_OF_BOTH',
}

export enum SyncZeroPriceAction {
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  SKIP = 'SKIP',
  DEACTIVATE = 'DEACTIVATE',
}

export enum SyncMissingProductsAction {
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DEACTIVATE = 'DEACTIVATE',
  DO_NOTHING = 'DO_NOTHING',
}

export enum SyncNewProductsAction {
  AUTO_PUBLISH = 'AUTO_PUBLISH',
  CREATE_DRAFT = 'CREATE_DRAFT',
  IGNORE = 'IGNORE',
}

export enum SyncStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum SyncTrigger {
  MANUAL = 'MANUAL',
  SCHEDULED = 'SCHEDULED',
  FEED_UPDATE = 'FEED_UPDATE',
}
