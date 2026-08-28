import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { CheckoutResponseDto, WayForPayWebhookDto } from '@smartfeed/shared';

export interface CreateWayForPayCheckoutParams {
  merchantAccount: string;
  merchantSecretKey: string;
  merchantDomainName: string;
  orderReference: string;
  orderDate: number;
  amount: number;
  currency: string;
  productName: string[];
  productPrice: number[];
  productCount: number[];
  clientEmail: string;
  clientName?: string;
  serviceUrl?: string;
  returnUrl?: string;
}

@Injectable()
export class WayForPayService {
  private readonly logger = new Logger(WayForPayService.name);

  /**
   * Calculates HMAC-MD5 signature for an array of fields joined by semicolon.
   */
  public generateHmacMd5(fields: (string | number)[], secretKey: string): string {
    const rawString = fields.map((f) => String(f)).join(';');
    return crypto.createHmac('md5', secretKey).update(rawString, 'utf8').digest('hex');
  }

  /**
   * Generates signature and returns complete checkout parameters for WayForPay.
   */
  public createCheckoutPayload(params: CreateWayForPayCheckoutParams): CheckoutResponseDto {
    const signatureFields = [
      params.merchantAccount,
      params.merchantDomainName,
      params.orderReference,
      params.orderDate,
      params.amount,
      params.currency,
      ...params.productName,
      ...params.productCount,
      ...params.productPrice,
    ];

    const merchantSignature = this.generateHmacMd5(signatureFields, params.merchantSecretKey);

    return {
      orderReference: params.orderReference,
      merchantAccount: params.merchantAccount,
      merchantDomainName: params.merchantDomainName,
      merchantSignature,
      orderDate: params.orderDate,
      amount: params.amount,
      currency: params.currency,
      productName: params.productName,
      productPrice: params.productPrice,
      productCount: params.productCount,
      clientEmail: params.clientEmail,
      clientName: params.clientName,
      serviceUrl: params.serviceUrl,
      returnUrl: params.returnUrl,
      invoiceUrl: `https://secure.wayforpay.com/pay?behavior=offline`,
    };
  }

  /**
   * Verifies incoming Webhook merchantSignature.
   */
  public verifyWebhookSignature(payload: WayForPayWebhookDto, secretKey: string): boolean {
    try {
      const signatureFields = [
        payload.merchantAccount,
        payload.orderReference,
        payload.amount,
        payload.currency,
        payload.authCode || '',
        payload.cardPan || '',
        payload.transactionStatus,
        payload.reasonCode || '',
      ];

      const expectedSignature = this.generateHmacMd5(signatureFields, secretKey);
      return expectedSignature.toLowerCase() === (payload.merchantSignature || '').toLowerCase();
    } catch (err) {
      this.logger.error('Error validating WayForPay webhook signature', err);
      return false;
    }
  }

  /**
   * Generates WayForPay standard accept JSON response.
   */
  public generateAcceptResponse(
    orderReference: string,
    secretKey: string,
  ): {
    orderReference: string;
    status: string;
    time: number;
    signature: string;
  } {
    const time = Math.floor(Date.now() / 1000);
    const signature = this.generateHmacMd5([orderReference, 'accept', time], secretKey);

    return {
      orderReference,
      status: 'accept',
      time,
      signature,
    };
  }

  /**
   * Creates a properly signed simulated webhook payload for Sandbox testing.
   */
  public createSimulatedWebhookPayload(
    merchantAccount: string,
    secretKey: string,
    orderReference: string,
    amount: number,
    currency: string,
    status: 'Approved' | 'Declined',
    reason?: string,
    rawCardPan?: string,
    rawCardType?: string,
    rawIssuerBank?: string,
  ): WayForPayWebhookDto {
    const authCode =
      status === 'Approved' ? `AUTH-${Math.floor(100000 + Math.random() * 900000)}` : undefined;

    // Mask card PAN: e.g. "411111****1111"
    const cleanedDigits = (rawCardPan || '4111111111111111').replace(/\D/g, '');
    const first6 = cleanedDigits.slice(0, 6).padEnd(6, '4');
    const last4 = cleanedDigits.slice(-4).padStart(4, '1');
    const cardPan = `${first6}****${last4}`;

    let cardType = rawCardType;
    if (!cardType) {
      if (cleanedDigits.startsWith('4')) cardType = 'Visa';
      else if (cleanedDigits.startsWith('5')) cardType = 'MasterCard';
      else cardType = 'Visa';
    }

    const issuerBankName =
      rawIssuerBank || (cleanedDigits.startsWith('5') ? 'PrivatBank' : 'Monobank');

    const signatureFields = [
      merchantAccount,
      orderReference,
      amount,
      currency,
      authCode || '',
      cardPan,
      status,
      reason ? '1100' : '',
    ];

    const merchantSignature = this.generateHmacMd5(signatureFields, secretKey);

    return {
      merchantAccount,
      orderReference,
      merchantSignature,
      amount,
      currency,
      authCode,
      cardPan,
      cardType,
      issuerBankName,
      transactionStatus: status,
      reason: reason || (status === 'Approved' ? 'Ok' : 'Insufficient funds'),
      reasonCode: reason ? 1100 : undefined,
      createdDate: Math.floor(Date.now() / 1000),
      processingDate: Math.floor(Date.now() / 1000),
    };
  }
}
