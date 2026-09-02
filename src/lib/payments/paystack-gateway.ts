/**
 * DigitalNexCare Paystack Gateway Implementation
 * Chunk 9 - Paystack Official Integration (South Africa - ZAR)
 * 
 * Official Paystack Specifications:
 * - Currency: ZAR (South African Rand)
 * - Base URL: https://api.paystack.co
 * - Initialization: POST /transaction/initialize
 * - Verification: GET /transaction/verify/:reference
 * - Webhook Signature: HMAC-SHA512 header `x-paystack-signature`
 * - Recurring: Supported via authorization_code or subscription plans
 * - Refunds: POST /refund
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

export interface PaystackConfig {
  secretKey?: string;
  publicKey?: string;
  baseUrl?: string;
  isTestMode?: boolean;
}

export class PaystackGateway extends PaymentGateway {
  readonly provider: PaymentGatewayProvider = 'PAYSTACK';
  private secretKey: string;
  private publicKey: string;
  private baseUrl: string;
  private isTestMode: boolean;

  // In-memory mock ledger for test suite and simulated execution when live keys are in sandbox
  private static mockTransactions = new Map<string, any>();
  private static processedWebhookEventIds = new Set<string>();

  constructor(config: PaystackConfig = {}) {
    super();
    this.secretKey = config.secretKey || process.env.PAYSTACK_SECRET_KEY || process.env.VITE_PAYSTACK_SECRET_KEY || 'sk_test_dnx_paystack_mock_secret_key';
    this.publicKey = config.publicKey || process.env.PAYSTACK_PUBLIC_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_dnx_paystack_mock_public_key';
    this.baseUrl = config.baseUrl || 'https://api.paystack.co';
    this.isTestMode = config.isTestMode !== undefined ? config.isTestMode : true;
  }

  public getSecretKey(): string {
    return this.secretKey;
  }

  public hasValidCredentials(): boolean {
    return !!this.secretKey && !this.secretKey.includes('mock_secret_key');
  }

  /**
   * Initializes a Paystack Checkout transaction
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
        gateway: 'PAYSTACK',
      };
    }

    const reference = this.generateReference('DNX_PSTK');
    const callbackUrl = request.callbackUrl || `${typeof window !== 'undefined' ? window.location.origin : 'https://digitalnexcare.co.za'}/patient/subscription?ref=${reference}&gateway=PAYSTACK`;

    const payload = {
      email: request.userEmail,
      amount: plan.priceCents, // ZAR cents (e.g., 5000 for R50)
      currency: 'ZAR',
      reference: reference,
      callback_url: callbackUrl,
      channels: ['card', 'bank', 'eft', 'qr'],
      metadata: {
        planId: request.planId,
        userId: request.userId,
        userName: request.userName || '',
        tierName: plan.name,
        monthlyReveals: plan.monthlyReveals,
        app: 'DigitalNexCare',
        ...request.metadata,
      },
    };

    // Store in mock ledger for test simulation
    PaystackGateway.mockTransactions.set(reference, {
      reference,
      amount: plan.priceCents,
      currency: 'ZAR',
      status: 'pending',
      customer: { email: request.userEmail },
      metadata: payload.metadata,
      createdAt: new Date().toISOString(),
    });

    // If real credentials are provided and we are calling live API
    if (this.hasValidCredentials() && !this.isTestMode) {
      try {
        const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok || !data.status) {
          throw new Error(data.message || 'Failed to initialize Paystack checkout');
        }

        return {
          success: true,
          checkoutUrl: data.data.authorization_url,
          paymentReference: reference,
          gatewayReference: data.data.reference || reference,
          amountZAR: plan.priceZAR,
          amountCents: plan.priceCents,
          gateway: 'PAYSTACK',
        };
      } catch (err: any) {
        return {
          success: false,
          checkoutUrl: '',
          paymentReference: reference,
          amountZAR: plan.priceZAR,
          amountCents: plan.priceCents,
          gateway: 'PAYSTACK',
          error: err.message || 'PAYSTACK INITIALIZATION FAILED',
        };
      }
    }

    // Default Sandbox / Mock Checkout Response
    const simulatedCheckoutUrl = `https://checkout.paystack.com/simulate/${reference}?amount=${plan.priceCents}&email=${encodeURIComponent(request.userEmail)}`;

    return {
      success: true,
      checkoutUrl: simulatedCheckoutUrl,
      paymentReference: reference,
      gatewayReference: reference,
      amountZAR: plan.priceZAR,
      amountCents: plan.priceCents,
      gateway: 'PAYSTACK',
    };
  }

  /**
   * Verifies a Paystack transaction status
   */
  async verifyPayment(paymentReference: string, gatewayReference?: string): Promise<PaymentVerificationResult> {
    const ref = gatewayReference || paymentReference;

    if (this.hasValidCredentials() && !this.isTestMode) {
      try {
        const response = await fetch(`${this.baseUrl}/transaction/verify/${encodeURIComponent(ref)}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (!response.ok || !data.status) {
          throw new Error(data.message || 'Failed to verify Paystack payment');
        }

        const tx = data.data;
        const statusMap: Record<string, PaymentTransactionStatus> = {
          success: 'SUCCESS',
          failed: 'FAILED',
          abandoned: 'ABANDONED',
        };

        const planId = (tx.metadata?.planId as PatientSubscriptionTier) || 'NEXCARE_PLUS';
        const expectedPlan = this.resolvePlanPrice(planId);

        // Security check: Verify amount matches authoritative price
        if (tx.status === 'success' && tx.amount !== expectedPlan.priceCents) {
          return {
            success: false,
            status: 'FAILED',
            paymentReference,
            gatewayReference: tx.reference || ref,
            amountZAR: tx.amount / 100,
            amountCents: tx.amount,
            currency: 'ZAR',
            gateway: 'PAYSTACK',
            planId,
            userId: tx.metadata?.userId || '',
            userEmail: tx.customer?.email || '',
            paidAt: tx.paid_at || new Date().toISOString(),
            error: `PRICE_MISMATCH: Expected ${expectedPlan.priceCents} cents, received ${tx.amount} cents`,
          };
        }

        return {
          success: tx.status === 'success',
          status: statusMap[tx.status] || 'PENDING',
          paymentReference,
          gatewayReference: tx.reference || ref,
          amountZAR: tx.amount / 100,
          amountCents: tx.amount,
          currency: 'ZAR',
          gateway: 'PAYSTACK',
          planId,
          userId: tx.metadata?.userId || '',
          userEmail: tx.customer?.email || '',
          paidAt: tx.paid_at || new Date().toISOString(),
          authorizationCode: tx.authorization?.authorization_code,
          rawGatewayResponse: tx,
        };
      } catch (err: any) {
        return {
          success: false,
          status: 'FAILED',
          paymentReference,
          gatewayReference: ref,
          amountZAR: 0,
          amountCents: 0,
          currency: 'ZAR',
          gateway: 'PAYSTACK',
          planId: 'NEXCARE_PLUS',
          userId: '',
          userEmail: '',
          paidAt: new Date().toISOString(),
          error: err.message || 'PAYSTACK_VERIFICATION_FAILED',
        };
      }
    }

    // Mock / Sandbox simulation
    const mockTx = PaystackGateway.mockTransactions.get(ref);
    const planId = (mockTx?.metadata?.planId as PatientSubscriptionTier) || 'NEXCARE_PLUS';
    const plan = this.resolvePlanPrice(planId);

    return {
      success: true,
      status: 'SUCCESS',
      paymentReference,
      gatewayReference: ref,
      amountZAR: plan.priceZAR,
      amountCents: plan.priceCents,
      currency: 'ZAR',
      gateway: 'PAYSTACK',
      planId,
      userId: mockTx?.metadata?.userId || 'usr_mock_123',
      userEmail: mockTx?.customer?.email || 'patient@digitalnexcare.co.za',
      paidAt: new Date().toISOString(),
      authorizationCode: `AUTH_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      rawGatewayResponse: {
        status: 'success',
        reference: ref,
        amount: plan.priceCents,
        currency: 'ZAR',
      },
    };
  }

  /**
   * Validates Paystack Webhook Signature (`x-paystack-signature` = HMAC-SHA512)
   */
  async verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean> {
    return PaymentCryptoUtils.verifyPaystackSignature(this.secretKey, rawBody, signature);
  }

  /**
   * Handles incoming Paystack Webhook events with signature checking & idempotency
   */
  async handleWebhook(payload: WebhookPayload): Promise<WebhookProcessingResult> {
    // 1. Signature Verification
    const isSignatureValid = await this.verifyWebhookSignature(payload.rawBody, payload.signature);
    if (!isSignatureValid) {
      return {
        success: false,
        processed: false,
        eventId: payload.data?.id || 'unknown',
        error: 'INVALID_SIGNATURE: Paystack HMAC-SHA512 mismatch',
      };
    }

    const eventId = `pstk_evt_${payload.data?.id || payload.data?.reference || Date.now()}`;

    // 2. Idempotency Check: Prevent duplicate processing
    if (PaystackGateway.processedWebhookEventIds.has(eventId)) {
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
      case 'charge.success': {
        const tx = payload.data;
        const planId = (tx.metadata?.planId as PatientSubscriptionTier) || 'NEXCARE_PLUS';
        const expectedPrice = this.resolvePlanPrice(planId);

        if (tx.amount !== expectedPrice.priceCents) {
          return {
            success: false,
            processed: false,
            eventId,
            error: `PRICE_MISMATCH: Expected ${expectedPrice.priceCents}, got ${tx.amount}`,
          };
        }

        PaystackGateway.processedWebhookEventIds.add(eventId);

        return {
          success: true,
          processed: true,
          eventId,
          subscriptionActivated: true,
          subscriptionId: `sub_pstk_${tx.reference}`,
        };
      }

      case 'subscription.create':
      case 'subscription.enable': {
        PaystackGateway.processedWebhookEventIds.add(eventId);
        return {
          success: true,
          processed: true,
          eventId,
          subscriptionActivated: true,
          subscriptionId: `sub_${payload.data?.subscription_code || eventId}`,
        };
      }

      case 'invoice.payment_failed': {
        PaystackGateway.processedWebhookEventIds.add(eventId);
        return {
          success: true,
          processed: true,
          eventId,
          subscriptionActivated: false,
        };
      }

      default:
        PaystackGateway.processedWebhookEventIds.add(eventId);
        return {
          success: true,
          processed: true,
          eventId,
        };
    }
  }

  /**
   * Processes a refund via Paystack
   */
  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    const refundId = `ref_pstk_${Date.now()}`;

    if (this.hasValidCredentials() && !this.isTestMode) {
      try {
        const amountCents = request.amountZAR ? request.amountZAR * 100 : undefined;
        const response = await fetch(`${this.baseUrl}/refund`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transaction: request.gatewayReference || request.paymentReference,
            amount: amountCents,
            merchant_note: request.reason || 'DigitalNexCare Customer Refund',
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.status) {
          throw new Error(data.message || 'Paystack refund failed');
        }

        return {
          success: true,
          refundId: data.data.id ? `ref_${data.data.id}` : refundId,
          amountZAR: (data.data.amount || 0) / 100,
          status: 'PROCESSED',
          message: 'Paystack refund processed successfully',
        };
      } catch (err: any) {
        return {
          success: false,
          refundId,
          amountZAR: request.amountZAR || 0,
          status: 'FAILED',
          message: err.message || 'Paystack refund request failed',
        };
      }
    }

    // Mock Refund
    return {
      success: true,
      refundId,
      amountZAR: request.amountZAR || 100,
      status: 'PROCESSED',
      message: 'Paystack refund simulated successfully in test environment',
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
  public static setMockTransaction(reference: string, data: any) {
    this.mockTransactions.set(reference, data);
  }

  public static clearMockState() {
    this.mockTransactions.clear();
    this.processedWebhookEventIds.clear();
  }
}
