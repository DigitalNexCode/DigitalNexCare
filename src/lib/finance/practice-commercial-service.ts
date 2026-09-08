/**
 * DigitalNexCare Practice Commercial Settings & Subscription Service
 * Manages Practice Flex (R149/mo), booking allowance usage (10 included + R25 overage),
 * payment modes (Online vs Pay at Practice vs Both), and commercial terms acceptance.
 */

import {
  PracticePaymentSettings,
  AppointmentTypePaymentConfig,
  PracticeCommercialSubscription,
  PracticeBookingAllowanceUsage,
  CommercialTermsAcceptance,
  PaymentMode,
} from '../../types/finance';
import { DEFAULT_COMMERCIAL_CONFIG, COMMERCIAL_TERMS_VERSION } from './finance-constants';
import { FinancialMath } from './financial-math';

export class PracticeCommercialService {
  private static paymentSettings = new Map<string, PracticePaymentSettings>();
  private static appointmentTypeConfigs = new Map<string, AppointmentTypePaymentConfig>();
  private static subscriptions = new Map<string, PracticeCommercialSubscription>();
  private static allowanceUsages = new Map<string, PracticeBookingAllowanceUsage[]>();
  private static termsAcceptances = new Map<string, CommercialTermsAcceptance>();

  static {
    this.seedDefaultCommercialData();
  }

  private static seedDefaultCommercialData() {
    const defaultSettings: PracticePaymentSettings = {
      id: 'settings_demo_001',
      practiceId: 'prac-001',
      defaultPaymentMode: 'ONLINE_OR_PRACTICE',
      allowOnlinePayment: true,
      allowPayAtPractice: true,
      requiresDepositByDefault: false,
      acceptsCommercialTerms: true,
      termsAcceptedAt: '2026-08-01T10:00:00.000Z',
      termsAcceptedBy: 'dr_mokoena_001',
      termsVersion: COMMERCIAL_TERMS_VERSION,
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    };
    this.paymentSettings.set(defaultSettings.practiceId, defaultSettings);
    this.paymentSettings.set('default', defaultSettings);

    // Seed appointment type payment configs
    this.setAppointmentTypeConfig({
      appointmentTypeId: 'apt-type-001', // General Consultation
      practiceId: 'prac-001',
      paymentMode: 'ONLINE_OR_PRACTICE',
      consultationPriceCents: 70000, // R700.00
      isPriceFixed: true,
      isEstimate: false,
      currency: 'ZAR',
    });

    this.setAppointmentTypeConfig({
      appointmentTypeId: 'apt-type-002', // Virtual Telehealth
      practiceId: 'prac-001',
      paymentMode: 'ONLINE_REQUIRED',
      consultationPriceCents: 65000, // R650.00
      isPriceFixed: true,
      isEstimate: false,
      currency: 'ZAR',
    });

    this.setAppointmentTypeConfig({
      appointmentTypeId: 'apt-type-003', // Specialist / Minor Procedure
      practiceId: 'prac-001',
      paymentMode: 'DEPOSIT_REQUIRED',
      consultationPriceCents: 150000, // R1,500.00
      depositAmountCents: 50000, // R500.00 deposit
      isPriceFixed: true,
      isEstimate: false,
      currency: 'ZAR',
    });

    // Seed default Practice Flex subscription
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const flexSub: PracticeCommercialSubscription = {
      id: 'sub_flex_001',
      practiceId: 'prac-001',
      planCode: 'PRACTICE_FLEX',
      status: 'ACTIVE',
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      includedBookings: DEFAULT_COMMERCIAL_CONFIG.practiceFlexIncludedBookings,
      usedBookings: 6,
      overageCount: 0,
      overageChargeCents: 0,
      monthlyBaseCents: DEFAULT_COMMERCIAL_CONFIG.practiceFlexMonthlyPriceCents,
      cancelAtPeriodEnd: false,
      lastBilledAt: periodStart,
      createdAt: periodStart,
      updatedAt: now.toISOString(),
    };
    this.subscriptions.set(flexSub.practiceId, flexSub);
    this.subscriptions.set('default', flexSub);
  }

  /**
   * Get practice payment settings
   */
  public static getPaymentSettings(practiceId: string): PracticePaymentSettings {
    const existing = this.paymentSettings.get(practiceId) || this.paymentSettings.get('default');
    if (existing) return existing;

    const newSettings: PracticePaymentSettings = {
      id: `settings_${Date.now()}`,
      practiceId,
      defaultPaymentMode: 'ONLINE_OR_PRACTICE',
      allowOnlinePayment: false,
      allowPayAtPractice: true,
      requiresDepositByDefault: false,
      acceptsCommercialTerms: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.paymentSettings.set(practiceId, newSettings);
    return newSettings;
  }

  /**
   * Accept Commercial Terms for Practice
   */
  public static acceptCommercialTerms(params: {
    practiceId: string;
    acceptedByUserId: string;
    enableOnlinePayment: boolean;
    enablePayAtPractice: boolean;
    termsVersion?: string;
    ipAddress?: string;
    userAgent?: string;
  }): CommercialTermsAcceptance {
    const version = params.termsVersion || COMMERCIAL_TERMS_VERSION;
    const acceptance: CommercialTermsAcceptance = {
      id: `terms_acc_${Date.now()}`,
      practiceId: params.practiceId,
      termsVersion: version,
      acceptedPlatformFeePercent: DEFAULT_COMMERCIAL_CONFIG.bookingPlatformFeePercent,
      acceptedGatewayPolicy: true,
      acceptedSettlementModel: true,
      acceptedByUserId: params.acceptedByUserId,
      acceptedAt: new Date().toISOString(),
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    };
    this.termsAcceptances.set(params.practiceId, acceptance);

    const settings = this.getPaymentSettings(params.practiceId);
    settings.acceptsCommercialTerms = true;
    settings.termsAcceptedAt = acceptance.acceptedAt;
    settings.termsAcceptedBy = params.acceptedByUserId;
    settings.termsVersion = version;
    settings.allowOnlinePayment = params.enableOnlinePayment;
    settings.allowPayAtPractice = params.enablePayAtPractice;
    settings.updatedAt = new Date().toISOString();
    this.paymentSettings.set(params.practiceId, settings);

    return acceptance;
  }

  /**
   * Update practice payment settings
   */
  public static updatePaymentSettings(
    practiceId: string,
    updates: Partial<PracticePaymentSettings>
  ): PracticePaymentSettings {
    const current = this.getPaymentSettings(practiceId);
    const updated: PracticePaymentSettings = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.paymentSettings.set(practiceId, updated);
    return updated;
  }

  /**
   * Configure appointment type payment settings
   */
  public static setAppointmentTypeConfig(
    config: AppointmentTypePaymentConfig
  ): AppointmentTypePaymentConfig {
    const key = `${config.practiceId}_${config.appointmentTypeId}`;
    this.appointmentTypeConfigs.set(key, config);
    this.appointmentTypeConfigs.set(config.appointmentTypeId, config);
    return config;
  }

  /**
   * Get payment config for appointment type with fallback to practice defaults
   */
  public static getAppointmentTypeConfig(
    practiceId: string,
    appointmentTypeId: string,
    fallbackPriceZAR: number = 700
  ): AppointmentTypePaymentConfig {
    const key = `${practiceId}_${appointmentTypeId}`;
    const specific =
      this.appointmentTypeConfigs.get(key) || this.appointmentTypeConfigs.get(appointmentTypeId);
    if (specific) return specific;

    const practiceSettings = this.getPaymentSettings(practiceId);
    return {
      appointmentTypeId,
      practiceId,
      paymentMode: practiceSettings.defaultPaymentMode,
      consultationPriceCents: fallbackPriceZAR * 100,
      isPriceFixed: true,
      isEstimate: false,
      currency: 'ZAR',
    };
  }

  /**
   * Get or initialize Practice Flex subscription
   */
  public static getPracticeFlexSubscription(
    practiceId: string
  ): PracticeCommercialSubscription | null {
    return this.subscriptions.get(practiceId) || this.subscriptions.get('default') || null;
  }

  /**
   * Subscribe or activate Practice Flex (R149/month)
   */
  public static subscribeToPracticeFlex(practiceId: string): PracticeCommercialSubscription {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const sub: PracticeCommercialSubscription = {
      id: `sub_flex_${Date.now()}`,
      practiceId,
      planCode: 'PRACTICE_FLEX',
      status: 'ACTIVE',
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      includedBookings: DEFAULT_COMMERCIAL_CONFIG.practiceFlexIncludedBookings,
      usedBookings: 0,
      overageCount: 0,
      overageChargeCents: 0,
      monthlyBaseCents: DEFAULT_COMMERCIAL_CONFIG.practiceFlexMonthlyPriceCents,
      cancelAtPeriodEnd: false,
      lastBilledAt: periodStart,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.subscriptions.set(practiceId, sub);
    return sub;
  }

  /**
   * Record booking allowance usage for Pay-At-Practice appointments
   * Rule: Only COMPLETED appointments consume allowance or trigger overage.
   * Cancelled / test / provider-cancelled bookings do NOT consume allowance or trigger overage!
   */
  public static recordPayAtPracticeBooking(params: {
    practiceId: string;
    appointmentId: string;
    appointmentStatus: string; // 'COMPLETED', 'CONFIRMED', 'CANCELLED', etc.
  }): {
    usage: PracticeBookingAllowanceUsage;
    subscription: PracticeCommercialSubscription | null;
    isOverage: boolean;
    overageFeeCents: number;
  } {
    const sub = this.getPracticeFlexSubscription(params.practiceId);
    const isQualifying = params.appointmentStatus === 'COMPLETED';

    const existingUsages = this.allowanceUsages.get(params.practiceId) || [];
    const qualifyingCount = existingUsages.filter((u) => u.isQualifying).length;

    // Is this booking exceeding the included 10?
    let isOverage = false;
    let overageFeeCents = 0;

    if (isQualifying) {
      if (qualifyingCount >= DEFAULT_COMMERCIAL_CONFIG.practiceFlexIncludedBookings) {
        isOverage = true;
        overageFeeCents = DEFAULT_COMMERCIAL_CONFIG.practiceFlexOverageCents; // R25
      }
    }

    const now = new Date();
    const periodStart = sub ? sub.currentPeriodStart : now.toISOString();
    const periodEnd = sub ? sub.currentPeriodEnd : now.toISOString();

    const usage: PracticeBookingAllowanceUsage = {
      id: `usage_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      practiceId: params.practiceId,
      appointmentId: params.appointmentId,
      appointmentStatus: params.appointmentStatus,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      isQualifying,
      isOverage,
      overageFeeCents,
      createdAt: now.toISOString(),
    };

    existingUsages.push(usage);
    this.allowanceUsages.set(params.practiceId, existingUsages);

    // Update subscription record if applicable
    if (sub && isQualifying) {
      const newQualifyingCount = qualifyingCount + 1;
      const overageCount = Math.max(
        0,
        newQualifyingCount - DEFAULT_COMMERCIAL_CONFIG.practiceFlexIncludedBookings
      );
      sub.usedBookings = newQualifyingCount;
      sub.overageCount = overageCount;
      sub.overageChargeCents = overageCount * DEFAULT_COMMERCIAL_CONFIG.practiceFlexOverageCents;
      sub.updatedAt = now.toISOString();
      this.subscriptions.set(params.practiceId, sub);
    }

    return {
      usage,
      subscription: sub,
      isOverage,
      overageFeeCents,
    };
  }

  /**
   * Get all booking usages for a practice
   */
  public static getAllowanceUsages(practiceId: string): PracticeBookingAllowanceUsage[] {
    return this.allowanceUsages.get(practiceId) || [];
  }
}
