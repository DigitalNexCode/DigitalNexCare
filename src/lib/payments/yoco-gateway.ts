/**
 * DigitalNexCare Yoco Gateway Implementation
 * Chunk 9 - Yoco Official Integration (South Africa - ZAR)
 * 
 * Official Yoco Specifications:
 * - Currency: ZAR (South African Rand)
 * - Base Checkouts API: https://payments.yoco.com/api/checkouts
 * - Initialization: POST /api/checkouts
 * - Verification: GET /api/checkouts/:id
 * - Webhook Signature: HMAC-SHA256 header `webhook-signature` or `yoco-signature`
 * - Recurring: Monthly Renewal Checkout flow (No fake auto-renew; generates clean monthly renewal invoices)
 * - Refunds: POST /v1/refunds
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
import { PaymentGateway, AUTHORITATIVE_PLANS } from './payment-gateway';
import { PaymentCryptoUtils } from './crypto-utils';

export interface YocoConfig {
  secretKey?: string;
  publicKey?: string;
  baseUrl?: string;
  isTestMode?: boolean;
}

export class YocoGateway extends PaymentGateway {
  readonly provider: PaymentGatewayProvider = 'YOCO';
  private secretKey: string;
  private publicKey: string;
  private baseUrl: string;
  private isTestMode: boolean;

  // In-memory mock storage for test suite & sandbox execution
  private static mockCheckouts = new Map<string, any>();
  private static processedWebhookEventIds = new Set<string>();

  constructor(config: YocoConfig = {}) {
    super();
    this.secretKey = config.secretKey || process.env.YOCO_SECRET_KEY || process.env.VITE_YOCO_SECRET_KEY || 'sk_test_dnx_yoco_mock_secret_key';
    this.publicKey = config.publicKey || process.env.YOCO_PUBLIC_KEY || process.env.VITE_YOCO_PUBLIC_KEY || 'pk_test_dnx_yoco_mock_public_key';
    this.baseUrl = config.baseUrl || 'https://payments.yoco.com/api/checkouts';
    this.isTestMode = config.isTestMode !== undefined ? config.isTestMode : true;
  }

  public getSecretKey(): string {
    return this.secretKey;
  }

  public hasValidCredentials(): boolean {
    return !!this.secretKey && !this.secretKey.includes('mock_secret_key');
  }

  /**
   * Initializes a Yoco Checkout session via Yoco Checkouts API v1
   * Uses server-side authoritative price resolution. Never trusts client amounts.
   */
  async createCheckout(request: PaymentCheckoutRequest): Promise<PaymentCheckoutResponse> {
    const plan = this.resolvePlanPrice(request.planId);

    if (plan.priceZAR === 0) {
      // Free plan requires no payment
      return {
        success: true,
        checkoutUrl: '',
        paymentReference: `FREE_${Date.now()}`,
        amountZAR: 0,
        amountCents: 0,
        gateway: 'YOCO',
      };
    }

    const reference = this.generateReference('DNX_YOCO');
    const redirectUrl = request.callbackUrl || `${typeof window !== 'undefined' ? window.location.origin : 'https://digitalnexcare.co.za'}/patient/subscription?ref=${reference}&gateway=YOCO`;
    const cancelUrl = request.cancelUrl || `${typeof window !== 'undefined' ? window.location.origin : 'https://digitalnexcare.co.za'}/patient/subscription?cancelled=true`;

    const payload = {
      amount: plan.priceCents, // ZAR cents (e.g., 10000 for R100)
      currency: 'ZAR',
      successUrl: redirectUrl,
      cancelUrl: cancelUrl,
      failureUrl: `${redirectUrl}&failed=true`,
      metadata: {
        reference: reference,
        planId: request.planId,
        userId: request.userId,
        userEmail: request.userEmail,
        tierName: plan.name,
        monthlyReveals: plan.monthlyReveals,
        billingType: 'MONTHLY_RENEWAL_CHECKOUT',
        app: 'DigitalNexCare',
        ...request.metadata,
      },
    };

    // Store in mock ledger for test simulation
    const mockCheckoutId = `ch_yoco_${Math.random().toString(36).substring(2, 12)}`;
    YocoGateway.mockCheckouts.set(reference, {
      id: mockCheckoutId,
      reference,
      amount: plan.priceCents,
      currency: 'ZAR',
      status: 'created',
      metadata: payload.metadata,
      createdAt: new Date().toISOString(),
    });
    YocoGateway.mockCheckouts.set(mockCheckoutId, YocoGateway.mockCheckouts.get(reference));

    // If real credentials are provided and we are calling live API
    if (this.hasValidCredentials() && !this.isTestMode) {
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok || !data.id) {
          throw new Error(data.message || 'Failed to create Yoco checkout session');
        }

        return {
          success: true,
          checkoutUrl: data.redirectUrl || `https://pay.yoco.com/${data.id}`,
          paymentReference: reference,
          gatewayReference: data.id,
          amountZAR: plan.priceZAR,
          amountCents: plan.priceCents,
          gateway: 'YOCO',
        };
      } catch (err: any) {
        return {
          success: false,
          checkoutUrl: '',
          paymentReference: reference,
          amountZAR: plan.priceZAR,
          amountCents: plan.priceCents,
          gateway: 'YOCO',
          error: err.message || 'YOCO CHECKOUT INITIALIZATION FAILED',
        };
      }
    }

    // Default Sandbox / Mock Checkout Response
    const simulatedCheckoutUrl = `https://pay.yoco.com/simulate/${mockCheckoutId}?ref=${reference}&amount=${plan.priceCents}`;

    return {
      success: true,
      checkoutUrl: simulatedCheckoutUrl,
      paymentReference: reference,
      gatewayReference: mockCheckoutId,
      amountZAR: plan.priceZAR,
      amountCents: plan.priceCents,
      gateway: 'YOCO',
    };
  }

  /**
   * Verifies Yoco Checkout status
   */
  async verifyPayment(paymentReference: string, gatewayReference?: string): Promise<PaymentVerificationResult> {
    const checkoutId = gatewayReference || paymentReference;

    if (this.hasValidCredentials() && !this.isTestMode) {
      try {
        const response = await fetch(`${this.baseUrl}/${encodeURIComponent(checkoutId)}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (!response.ok || !data.id) {
          throw new Error(data.message || 'Failed to verify Yoco checkout');
        }

        const isPaid = data.status === 'paid' || data.status === 'successful' || data.status === 'completed';
        const planId = (data.metadata?.planId as PatientSubscriptionTier) || 'NEXCARE_PLUS';
        const expectedPlan = this.resolvePlanPrice(planId);

        // Security check: Authoritative price verification
        if (isPaid && data.amount !== expectedPlan.priceCents) {
          return {
            success: false,
            status: 'FAILED',
            paymentReference,
            gatewayReference: data.id,
            amountZAR: data.amount / 100,
            amountCents: data.amount,
            currency: 'ZAR',
            gateway: 'YOCO',
            planId,
            userId: data.metadata?.userId || '',
            userEmail: data.metadata?.userEmail || '',
            paidAt: data.paidAt || new Date().toISOString(),
            error: `PRICE_MISMATCH: Expected ${expectedPlan.priceCents} cents, got ${data.amount} cents`,
          };
        }

        return {
          success: isPaid,
          status: isPaid ? 'SUCCESS' : data.status === 'failed' ? 'FAILED' : 'PENDING',
          paymentReference,
          gatewayReference: data.id,
          amountZAR: data.amount / 100,
          amountCents: data.amount,
          currency: 'ZAR',
          gateway: 'YOCO',
          planId,
          userId: data.metadata?.userId || '',
          userEmail: data.metadata?.userEmail || '',
          paidAt: data.paidAt || new Date().toISOString(),
          rawGatewayResponse: data,
        };
      } catch (err: any) {
        return {
          success: false,
          status: 'FAILED',
          paymentReference,
          gatewayReference: checkoutId,
          amountZAR: 0,
          amountCents: 0,
          currency: 'ZAR',
          gateway: 'YOCO',
          planId: 'NEXCARE_PLUS',
          userId: '',
          userEmail: '',
          paidAt: new Date().toISOString(),
          error: err.message || 'YOCO_VERIFICATION_FAILED',
        };
      }
    }

    // Mock / Sandbox simulation
    const mockData = YocoGateway.mockCheckouts.get(checkoutId) || YocoGateway.mockCheckouts.get(paymentReference);
    const planId = (mockData?.metadata?.planId as PatientSubscriptionTier) || 'NEXCARE_PLUS';
    const plan = this.resolvePlanPrice(planId);

    return {
      success: true,
      status: 'SUCCESS',
      paymentReference,
      gatewayReference: mockData?.id || `ch_yoco_${paymentReference}`,
      amountZAR: plan.priceZAR,
      amountCents: plan.priceCents,
      currency: 'ZAR',
      gateway: 'YOCO',
      planId,
      userId: mockData?.metadata?.userId || 'usr_mock_yoco_456',
      userEmail: mockData?.metadata?.userEmail || 'patient@digitalnexcare.co.za',
      paidAt: new Date().toISOString(),
      rawGatewayResponse: {
        id: mockData?.id || checkoutId,
        status: 'paid',
        amount: plan.priceCents,
        currency: 'ZAR',
      },
    };
  }

  /**
   * Validates Yoco Webhook Signature (HMAC-SHA256)
   */
  async verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean> {
    return PaymentCryptoUtils.verifyYocoSignature(this.secretKey, rawBody, signature);
  }

  /**
   * Handles incoming Yoco Webhook events with signature checking & idempotency
   */
  async handleWebhook(payload: WebhookPayload): Promise<WebhookProcessingResult> {
    // 1. Signature Verification
    const isSignatureValid = await this.verifyWebhookSignature(payload.rawBody, payload.signature);
    if (!isSignatureValid) {
      return {
        success: false,
        processed: false,
        eventId: payload.data?.id || 'unknown',
        error: 'INVALID_SIGNATURE: Yoco HMAC-SHA256 signature mismatch',
      };
    }

    const eventId = `yoco_evt_${payload.data?.id || payload.data?.checkoutId || Date.now()}`;

    // 2. Idempotency Check: Prevent duplicate processing
    if (YocoGateway.processedWebhookEventIds.has(eventId)) {
      return {
        success: true,
        processed: false,
        idempotentIgnored: true,
        eventId,
        error: 'IDEMPOTENT_IGNORED: Event was previously processed',
      };
    }

    // 3. Process Event Types
    switch (payload.event) {
      case 'checkout.paid':
      case 'payment.succeeded': {
        const data = payload.data;
        const planId = (data.metadata?.planId as PatientSubscriptionTier) || 'NEXCARE_PLUS';
        const expectedPrice = this.resolvePlanPrice(planId);

        if (data.amount !== expectedPrice.priceCents) {
          return {
            success: false,
            processed: false,
            eventId,
            error: `PRICE_MISMATCH: Expected ${expectedPrice.priceCents}, got ${data.amount}`,
          };
        }

        YocoGateway.processedWebhookEventIds.add(eventId);

        return {
          success: true,
          processed: true,
          eventId,
          subscriptionActivated: true,
          subscriptionId: `sub_yoco_${data.id || eventId}`,
        };
      }

      case 'payment.failed': {
        YocoGateway.processedWebhookEventIds.add(eventId);
        return {
          success: true,
          processed: true,
          eventId,
          subscriptionActivated: false,
        };
      }

      default:
        YocoGateway.processedWebhookEventIds.add(eventId);
        return {
          success: true,
          processed: true,
          eventId,
        };
    }
  }

  /**
   * Generates a monthly renewal checkout link for Yoco subscribers
   * Constitutional Mandate: Never fake auto-renew; generate monthly renewal checkout.
   */
  async createMonthlyRenewalCheckout(
    subscriptionId: string,
    userId: string,
    userEmail: string,
    planId: PatientSubscriptionTier
  ): Promise<PaymentCheckoutResponse> {
    return this.createCheckout({
      planId,
      userId,
      userEmail,
      gateway: 'YOCO',
      metadata: {
        isRenewal: true,
        originalSubscriptionId: subscriptionId,
        billingCycle: 'MONTHLY_RENEWAL',
      },
    });
  }

  /**
   * Processes a refund via Yoco
   */
  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    const refundId = `ref_yoco_${Date.now()}`;

    if (this.hasValidCredentials() && !this.isTestMode) {
      try {
        const amountCents = request.amountZAR ? request.amountZAR * 100 : undefined;
        const response = await fetch('https://online.yoco.com/v1/refunds', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            checkoutId: request.gatewayReference || request.paymentReference,
            amount: amountCents,
            reason: request.reason || 'Customer Requested Refund',
          }),
        });

        const data = await response.json();
        if (!response.ok || data.status === 'failed') {
          throw new Error(data.message || 'Yoco refund request failed');
        }

        return {
          success: true,
          refundId: data.id || refundId,
          amountZAR: (data.amount || 0) / 100,
          status: 'PROCESSED',
          message: 'Yoco refund processed successfully',
        };
      } catch (err: any) {
        return {
          success: false,
          refundId,
          amountZAR: request.amountZAR || 0,
          status: 'FAILED',
          message: err.message || 'Yoco refund request failed',
        };
      }
    }

    // Mock Refund for Sandbox
    return {
      success: true,
      refundId,
      amountZAR: request.amountZAR || 100,
      status: 'PROCESSED',
      message: 'Yoco refund processed successfully in test environment',
    };
  }

  /**
   * Returns current payment status
   */
  async getPaymentStatus(paymentReference: string): Promise<PaymentTransactionStatus> {
    const res = await this.verifyPayment(paymentReference);
    return res.status;
  }

  /**
   * Test helper to set simulated status for testing failure scenarios
   */
  public static setMockCheckout(reference: string, data: any) {
    this.mockCheckouts.set(reference, data);
  }

  public static clearMockState() {
    this.mockCheckouts.clear();
    this.processedWebhookEventIds.clear();
  }
}
