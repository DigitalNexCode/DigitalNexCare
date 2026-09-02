/**
 * DigitalNexCare Payment Gateway Abstraction
 * Chunk 9 - Paystack & Yoco Payment and Subscription Integration
 */

import {
  PaymentGatewayProvider,
  PaymentCheckoutRequest,
  PaymentCheckoutResponse,
  PaymentVerificationResult,
  WebhookPayload,
  WebhookProcessingResult,
  RefundRequest,
  RefundResponse,
  PaymentTransactionStatus,
  PatientSubscriptionTier,
} from '../../types';

export interface AuthoritativePlanPricing {
  tier: PatientSubscriptionTier;
  name: string;
  priceZAR: number;
  priceCents: number;
  monthlyReveals: number;
  currency: 'ZAR';
}

/**
 * Server-Side Authoritative Pricing Catalog
 * Constitutional Rule: Never trust client-provided amounts.
 */
export const AUTHORITATIVE_PLANS: Record<PatientSubscriptionTier, AuthoritativePlanPricing> = {
  NEXCARE_FREE: {
    tier: 'NEXCARE_FREE',
    name: 'NexCare Free',
    priceZAR: 0,
    priceCents: 0,
    monthlyReveals: 2,
    currency: 'ZAR',
  },
  NEXCARE_ACCESS: {
    tier: 'NEXCARE_ACCESS',
    name: 'NexCare Access',
    priceZAR: 50,
    priceCents: 5000,
    monthlyReveals: 5,
    currency: 'ZAR',
  },
  NEXCARE_PLUS: {
    tier: 'NEXCARE_PLUS',
    name: 'NexCare Plus',
    priceZAR: 100,
    priceCents: 10000,
    monthlyReveals: 20,
    currency: 'ZAR',
  },
  NEXCARE_FAMILY: {
    tier: 'NEXCARE_FAMILY',
    name: 'NexCare Family',
    priceZAR: 250,
    priceCents: 25000,
    monthlyReveals: -1, // Unlimited
    currency: 'ZAR',
  },
};

export abstract class PaymentGateway {
  abstract readonly provider: PaymentGatewayProvider;

  /**
   * Generates a unique transaction / checkout reference
   */
  protected generateReference(prefix: string = 'DNX'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Resolves the server-side authoritative price in ZAR cents for a given plan
   */
  public resolvePlanPrice(planId: PatientSubscriptionTier): AuthoritativePlanPricing {
    const plan = AUTHORITATIVE_PLANS[planId];
    if (!plan) {
      throw new Error(`Invalid plan tier: ${planId}`);
    }
    return plan;
  }

  /**
   * Initializes a new payment checkout session with the gateway
   */
  abstract createCheckout(request: PaymentCheckoutRequest): Promise<PaymentCheckoutResponse>;

  /**
   * Queries and verifies transaction status from the gateway
   */
  abstract verifyPayment(paymentReference: string, gatewayReference?: string): Promise<PaymentVerificationResult>;

  /**
   * Processes incoming server-side webhook payload with signature validation & idempotency
   */
  abstract handleWebhook(payload: WebhookPayload): Promise<WebhookProcessingResult>;

  /**
   * Processes a refund via the gateway
   */
  abstract refundPayment(request: RefundRequest): Promise<RefundResponse>;

  /**
   * Returns current payment status
   */
  abstract getPaymentStatus(paymentReference: string): Promise<PaymentTransactionStatus>;

  /**
   * Validates webhook signature
   */
  abstract verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean>;
}
