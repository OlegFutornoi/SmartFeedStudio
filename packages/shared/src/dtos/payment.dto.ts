import { z } from 'zod';
import { PaymentStatus, PaymentProvider, PaymentInterval } from '../enums';

// 1. Create Checkout Invoice Request
export const CreateCheckoutDtoSchema = z.object({
  planCode: z.string().min(1),
  billingInterval: z.enum(['monthly', 'yearly']).default('monthly'),
});

export type CreateCheckoutDto = z.infer<typeof CreateCheckoutDtoSchema>;

// 2. Checkout Invoice Response (Data needed to open WayForPay form / widget)
export const CheckoutResponseDtoSchema = z.object({
  invoiceUrl: z.string().url().optional(),
  orderReference: z.string(),
  merchantAccount: z.string(),
  merchantDomainName: z.string(),
  merchantSignature: z.string(),
  orderDate: z.number(),
  amount: z.number(),
  currency: z.string(),
  productName: z.array(z.string()),
  productPrice: z.array(z.number()),
  productCount: z.array(z.number()),
  clientEmail: z.string().email(),
  clientName: z.string().optional(),
  serviceUrl: z.string().url().optional(),
  returnUrl: z.string().url().optional(),
});

export type CheckoutResponseDto = z.infer<typeof CheckoutResponseDtoSchema>;

// 3. Payment Transaction Record (for UI tables & details)
export const PaymentTransactionDtoSchema = z.object({
  id: z.string(),
  orderReference: z.string(),
  userId: z.string(),
  userEmail: z.string().optional(),
  userFullName: z.string().nullable().optional(),
  planCode: z.string(),
  billingInterval: z.nativeEnum(PaymentInterval),
  amount: z.number(),
  currency: z.string(),
  status: z.nativeEnum(PaymentStatus),
  provider: z.nativeEnum(PaymentProvider),
  providerPaymentId: z.string().nullable().optional(),
  cardPan: z.string().nullable().optional(),
  cardType: z.string().nullable().optional(),
  issuerBank: z.string().nullable().optional(),
  failureReason: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PaymentTransactionDto = z.infer<typeof PaymentTransactionDtoSchema>;

// 4. Payment Gateway Settings DTO
export const PaymentSettingDtoSchema = z.object({
  id: z.string(),
  provider: z.nativeEnum(PaymentProvider),
  isEnabled: z.boolean(),
  isTestMode: z.boolean(),
  merchantAccount: z.string().nullable().optional(),
  merchantSecretKey: z.string().nullable().optional(),
  merchantDomain: z.string().nullable().optional(),
  serviceUrl: z.string().nullable().optional(),
  returnUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PaymentSettingDto = z.infer<typeof PaymentSettingDtoSchema>;

export const UpdatePaymentSettingDtoSchema = z.object({
  isEnabled: z.boolean().optional(),
  isTestMode: z.boolean().optional(),
  merchantAccount: z.string().optional().nullable(),
  merchantSecretKey: z.string().optional().nullable(),
  merchantDomain: z.string().optional().nullable(),
  serviceUrl: z.string().optional().nullable(),
  returnUrl: z.string().optional().nullable(),
});

export type UpdatePaymentSettingDto = z.infer<typeof UpdatePaymentSettingDtoSchema>;

// 5. WayForPay Webhook Payload DTO
export const WayForPayWebhookDtoSchema = z.object({
  merchantAccount: z.string(),
  orderReference: z.string(),
  merchantSignature: z.string(),
  amount: z.number().or(z.string()),
  currency: z.string(),
  authCode: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  createdDate: z.number().or(z.string()).optional(),
  processingDate: z.number().or(z.string()).optional(),
  cardPan: z.string().optional(),
  cardType: z.string().optional(),
  issuerBankName: z.string().optional(),
  transactionStatus: z.string(),
  reason: z.string().optional(),
  reasonCode: z.number().or(z.string()).optional(),
  fee: z.number().or(z.string()).optional(),
  paymentSystem: z.string().optional(),
});

export type WayForPayWebhookDto = z.infer<typeof WayForPayWebhookDtoSchema>;

// 6. Payment Analytics & Stats DTO
export const PaymentStatsDtoSchema = z.object({
  totalRevenueUah: z.number(),
  successfulCount: z.number(),
  pendingCount: z.number(),
  declinedCount: z.number(),
  averageCheckUah: z.number(),
  successRatePercent: z.number(),
});

export type PaymentStatsDto = z.infer<typeof PaymentStatsDtoSchema>;
