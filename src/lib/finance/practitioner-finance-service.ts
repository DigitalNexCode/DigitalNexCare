/**
 * DigitalNexCare Central Practitioner Finance & Commercial Service
 * CHUNK 9A: Unified Interface for Commercial Configuration, Banking Onboarding,
 * Weekly Settlements, Practice Flex Subscriptions, Invoices, Receipts & Financial Audit.
 */

import {
  BookingFeeBreakdown,
  PracticeBankAccount,
  BankChangeRequest,
  BankVerificationStatus,
  PracticePaymentSettings,
  AppointmentTypePaymentConfig,
  PracticeCommercialSubscription,
  PracticeSettlement,
  PaymentReceipt,
  FinancialStatement,
  FinancialAuditLogEntry,
  PracticeBalanceOverview,
} from '../../types/finance';
import { FinancialMath } from './financial-math';
import { BankingService } from './banking-service';
import { PracticeCommercialService } from './practice-commercial-service';
import { SettlementEngine, EligiblePaymentTransaction } from './settlement-engine';
import { ReceiptAndStatementService } from './receipt-and-statement-service';
import { DEFAULT_COMMERCIAL_CONFIG } from './finance-constants';

export class PractitionerFinanceService {
  private static auditLogs: FinancialAuditLogEntry[] = [];

  static {
    this.seedDefaultAuditLogs();
  }

  private static seedDefaultAuditLogs() {
    this.logAuditEvent({
      practiceId: 'prac-001',
      actorId: 'system_bootstrap',
      actorRole: 'SUPER_ADMIN',
      action: 'BANK_VERIFIED',
      details: {
        bankName: 'First National Bank (FNB)',
        accountMasked: '•••• 4821',
        branchCode: '250655',
      },
    });

    this.logAuditEvent({
      practiceId: 'prac-001',
      actorId: 'dr_mokoena_001',
      actorRole: 'PROVIDER',
      action: 'TERMS_ACCEPTED',
      details: {
        platformFeePercent: 7.0,
        gatewayPolicyAccepted: true,
        settlementModelAccepted: true,
      },
    });
  }

  public static logAuditEvent(params: {
    practiceId?: string;
    actorId: string;
    actorRole: string;
    action: FinancialAuditLogEntry['action'];
    details: Record<string, any>;
  }): FinancialAuditLogEntry {
    const entry: FinancialAuditLogEntry = {
      id: `faud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      practiceId: params.practiceId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      details: params.details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
    return entry;
  }

  public static getAuditLogs(practiceId?: string): FinancialAuditLogEntry[] {
    if (!practiceId || practiceId === 'all') return this.auditLogs;
    return this.auditLogs.filter((log) => log.practiceId === practiceId);
  }

  // --- Configuration & Fee Math ---
  public static getConfig() {
    return DEFAULT_COMMERCIAL_CONFIG;
  }

  public static calculateFeeBreakdown(
    grossAmountCents: number,
    actualGatewayFeeCents?: number
  ): BookingFeeBreakdown {
    return FinancialMath.calculateBookingFeeBreakdown(grossAmountCents, actualGatewayFeeCents);
  }

  // --- Banking Operations ---
  public static getBankAccount(practiceId: string): PracticeBankAccount | null {
    return BankingService.getPracticeBankAccount(practiceId);
  }

  public static submitBankOnboarding(params: Parameters<typeof BankingService.submitBankOnboarding>[0]) {
    const acc = BankingService.submitBankOnboarding(params);
    this.logAuditEvent({
      practiceId: params.practiceId,
      actorId: params.userId,
      actorRole: 'PROVIDER',
      action: 'BANK_ONBOARDING_SUBMITTED',
      details: {
        bankName: params.bankName,
        accountMasked: acc.accountNumberMasked,
      },
    });
    return acc;
  }

  public static requestBankDetailsChange(params: Parameters<typeof BankingService.requestBankDetailsChange>[0]) {
    const res = BankingService.requestBankDetailsChange(params);
    this.logAuditEvent({
      practiceId: params.practiceId,
      actorId: params.requestedBy,
      actorRole: 'PROVIDER',
      action: 'BANK_DETAILS_UPDATED',
      details: {
        oldAccountMasked: res.changeRequest.oldAccountMasked,
        newAccountMasked: res.changeRequest.newAccountMasked,
        newBank: res.changeRequest.newBankName,
      },
    });
    return res;
  }

  public static verifyBankChange(
    changeRequestId: string,
    adminUserId: string,
    approved: boolean,
    reason?: string
  ) {
    const res = BankingService.verifyBankChangeRequest(changeRequestId, adminUserId, approved, reason);
    if (res.account) {
      this.logAuditEvent({
        practiceId: res.account.practiceId,
        actorId: adminUserId,
        actorRole: 'PLATFORM_ADMIN',
        action: approved ? 'BANK_VERIFIED' : 'BANK_VERIFICATION_FAILED',
        details: { approved, reason, accountMasked: res.account.accountNumberMasked },
      });
    }
    return res;
  }

  public static setBankVerificationStatus(
    practiceId: string,
    status: BankVerificationStatus,
    adminId: string,
    reason?: string
  ) {
    const acc = BankingService.setVerificationStatus(practiceId, status, adminId, reason);
    if (acc) {
      this.logAuditEvent({
        practiceId,
        actorId: adminId,
        actorRole: 'PLATFORM_ADMIN',
        action: status === 'VERIFIED' ? 'BANK_VERIFIED' : 'BANK_VERIFICATION_FAILED',
        details: { status, reason },
      });
    }
    return acc;
  }

  public static getAllBankChangeRequests(): BankChangeRequest[] {
    return BankingService.getAllChangeRequests();
  }

  public static getAllBankAccounts(): PracticeBankAccount[] {
    return BankingService.getAllBankAccounts();
  }

  // --- Commercial Settings ---
  public static getPaymentSettings(practiceId: string): PracticePaymentSettings {
    return PracticeCommercialService.getPaymentSettings(practiceId);
  }

  public static acceptCommercialTerms(params: Parameters<typeof PracticeCommercialService.acceptCommercialTerms>[0]) {
    const acceptance = PracticeCommercialService.acceptCommercialTerms(params);
    this.logAuditEvent({
      practiceId: params.practiceId,
      actorId: params.acceptedByUserId,
      actorRole: 'PROVIDER',
      action: 'TERMS_ACCEPTED',
      details: {
        platformFeePercent: acceptance.acceptedPlatformFeePercent,
        version: acceptance.termsVersion,
      },
    });
    return acceptance;
  }

  public static updatePaymentSettings(practiceId: string, updates: Partial<PracticePaymentSettings>, actorId: string) {
    const res = PracticeCommercialService.updatePaymentSettings(practiceId, updates);
    this.logAuditEvent({
      practiceId,
      actorId,
      actorRole: 'PROVIDER',
      action: 'PAYMENT_SETTINGS_UPDATED',
      details: updates,
    });
    return res;
  }

  public static getAppointmentTypePaymentConfig(
    practiceId: string,
    appointmentTypeId: string,
    fallbackPriceZAR: number = 700
  ): AppointmentTypePaymentConfig {
    return PracticeCommercialService.getAppointmentTypeConfig(practiceId, appointmentTypeId, fallbackPriceZAR);
  }

  public static setAppointmentTypePaymentConfig(
    config: AppointmentTypePaymentConfig,
    actorId: string
  ): AppointmentTypePaymentConfig {
    const res = PracticeCommercialService.setAppointmentTypeConfig(config);
    this.logAuditEvent({
      practiceId: config.practiceId,
      actorId,
      actorRole: 'PROVIDER',
      action: 'PRICE_CONFIG_UPDATED',
      details: {
        appointmentTypeId: config.appointmentTypeId,
        mode: config.paymentMode,
        priceCents: config.consultationPriceCents,
      },
    });
    return res;
  }

  // --- Practice Flex ---
  public static getPracticeFlex(practiceId: string): PracticeCommercialSubscription | null {
    return PracticeCommercialService.getPracticeFlexSubscription(practiceId);
  }

  public static subscribeToPracticeFlex(practiceId: string, actorId: string): PracticeCommercialSubscription {
    const sub = PracticeCommercialService.subscribeToPracticeFlex(practiceId);
    this.logAuditEvent({
      practiceId,
      actorId,
      actorRole: 'PROVIDER',
      action: 'PRACTICE_FLEX_UPDATED',
      details: { status: sub.status, monthlyBaseCents: sub.monthlyBaseCents },
    });
    return sub;
  }

  public static recordPayAtPracticeBooking(params: {
    practiceId: string;
    appointmentId: string;
    appointmentStatus: string;
  }) {
    return PracticeCommercialService.recordPayAtPracticeBooking(params);
  }

  // --- Online Payments & Receipts ---
  public static recordOnlineBookingPayment(params: {
    paymentReference: string;
    appointmentId: string;
    practiceId: string;
    bookingReference: string;
    patientName: string;
    patientEmail: string;
    practitionerName: string;
    practiceName: string;
    practiceAddress: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentType: string;
    grossAmountCents: number;
    paymentGateway: 'PAYSTACK' | 'YOCO';
    actualGatewayFeeCents?: number;
  }): {
    success: boolean;
    transaction: EligiblePaymentTransaction;
    receipt: PaymentReceipt;
    breakdown: BookingFeeBreakdown;
  } {
    const breakdown = FinancialMath.calculateBookingFeeBreakdown(
      params.grossAmountCents,
      params.actualGatewayFeeCents
    );

    const transaction: EligiblePaymentTransaction = {
      paymentId: params.paymentReference,
      appointmentId: params.appointmentId,
      practiceId: params.practiceId,
      bookingReference: params.bookingReference,
      patientName: params.patientName,
      appointmentType: params.appointmentType,
      appointmentDate: params.appointmentDate,
      grossAmountCents: params.grossAmountCents,
      actualGatewayFeeCents: breakdown.gatewayFeeCents,
      paidAt: new Date().toISOString(),
      status: 'SUCCESS',
      refundedAmountCents: 0,
    };

    SettlementEngine.recordOnlinePaymentTransaction(transaction);

    const receipt = ReceiptAndStatementService.generatePaymentReceipt({
      paymentReference: params.paymentReference,
      appointmentId: params.appointmentId,
      patientName: params.patientName,
      patientEmail: params.patientEmail,
      practitionerName: params.practitionerName,
      practiceName: params.practiceName,
      practiceAddress: params.practiceAddress,
      appointmentDate: params.appointmentDate,
      appointmentTime: params.appointmentTime,
      appointmentType: params.appointmentType,
      grossAmountCents: params.grossAmountCents,
      paymentGateway: params.paymentGateway,
    });

    this.logAuditEvent({
      practiceId: params.practiceId,
      actorId: params.patientEmail,
      actorRole: 'PATIENT',
      action: 'PAYMENT_PROCESSED',
      details: {
        grossCents: params.grossAmountCents,
        platformFeeCents: breakdown.platformFeeCents,
        gatewayFeeCents: breakdown.gatewayFeeCents,
        receiptNumber: receipt.receiptNumber,
      },
    });

    return { success: true, transaction, receipt, breakdown };
  }

  public static getReceipt(identifier: string): PaymentReceipt | null {
    return ReceiptAndStatementService.getReceipt(identifier);
  }

  // --- Weekly Settlements ---
  public static getWeeklySettlements(practiceId: string): PracticeSettlement[] {
    return SettlementEngine.getPracticeSettlements(practiceId);
  }

  public static generateWeeklySettlement(practiceId: string, periodStart: string, periodEnd: string) {
    const s = SettlementEngine.generateWeeklySettlement(practiceId, periodStart, periodEnd);
    if (s) {
      this.logAuditEvent({
        practiceId,
        actorId: 'system_settlement_worker',
        actorRole: 'SYSTEM',
        action: 'SETTLEMENT_GENERATED',
        details: {
          settlementNumber: s.settlementNumber,
          netAmountCents: s.netAmountCents,
          items: s.itemCount,
        },
      });
    }
    return s;
  }

  public static markSettlementPaid(settlementId: string, gatewayReference?: string) {
    const res = SettlementEngine.markSettlementPaid(settlementId, gatewayReference);
    if (res.settlement) {
      this.logAuditEvent({
        practiceId: res.settlement.practiceId,
        actorId: 'admin_payout_worker',
        actorRole: 'FINANCE_BILLING',
        action: 'SETTLEMENT_STATUS_CHANGED',
        details: {
          settlementNumber: res.settlement.settlementNumber,
          status: 'PAID',
          gatewayRef: res.settlement.gatewaySettlementReference,
        },
      });
    }
    return res;
  }

  public static markSettlementFailed(settlementId: string, failureReason: string) {
    const res = SettlementEngine.markSettlementFailed(settlementId, failureReason);
    if (res) {
      this.logAuditEvent({
        practiceId: res.practiceId,
        actorId: 'admin_payout_worker',
        actorRole: 'FINANCE_BILLING',
        action: 'SETTLEMENT_STATUS_CHANGED',
        details: {
          settlementNumber: res.settlementNumber,
          status: 'FAILED',
          reason: failureReason,
        },
      });
    }
    return res;
  }

  // --- Refunds ---
  public static processPaymentRefund(params: Parameters<typeof SettlementEngine.processPaymentRefund>[0]) {
    const res = SettlementEngine.processPaymentRefund(params);
    if (res.success) {
      this.logAuditEvent({
        actorId: params.adminUserId,
        actorRole: 'PLATFORM_ADMIN',
        action: 'REFUND_PROCESSED',
        details: {
          paymentId: params.paymentId,
          refundAmountCents: params.refundAmountCents,
          isPostSettlement: res.isPostSettlement,
        },
      });
    }
    return res;
  }

  // --- Statements ---
  public static getPracticeStatements(practiceId: string): FinancialStatement[] {
    return ReceiptAndStatementService.getPracticeStatements(practiceId);
  }

  public static generateWeeklyStatement(practiceId: string, periodStart: string, periodEnd: string) {
    return ReceiptAndStatementService.generateWeeklySettlementStatement(practiceId, periodStart, periodEnd);
  }

  public static generateMonthlyStatement(practiceId: string, year: number, month: number) {
    return ReceiptAndStatementService.generateMonthlyPracticeStatement(practiceId, year, month);
  }

  // --- Overviews & Metrics ---
  public static getPracticeBalanceOverview(practiceId: string): PracticeBalanceOverview {
    return SettlementEngine.getPracticeBalanceOverview(practiceId);
  }

  public static getAdminFinancialMetrics() {
    const allTx = SettlementEngine.getPracticeTransactions('all');
    const allSettlements = SettlementEngine.getPracticeSettlements('all');
    const allBankAccounts = BankingService.getAllBankAccounts();

    let grossBookingValueCents = 0;
    let platformFeeRevenueCents = 0;
    let gatewayProcessingFeesCents = 0;
    let totalRefundsCents = 0;

    for (const tx of allTx) {
      const bk = FinancialMath.calculateBookingFeeBreakdown(
        tx.grossAmountCents,
        tx.actualGatewayFeeCents
      );
      grossBookingValueCents += bk.grossAmountCents;
      platformFeeRevenueCents += bk.platformFeeCents;
      gatewayProcessingFeesCents += bk.gatewayFeeCents;
      totalRefundsCents += tx.refundedAmountCents || 0;
    }

    const weeklySettlementsCount = allSettlements.length;
    const paidSettlements = allSettlements.filter((s) => s.status === 'PAID');
    const failedSettlementsCount = allSettlements.filter((s) => s.status === 'FAILED').length;
    const onHoldSettlementsCount = allSettlements.filter((s) => s.status === 'ON_HOLD').length;

    const netSettlementObligationsCents = allSettlements
      .filter((s) => s.status === 'READY' || s.status === 'PROCESSING' || s.status === 'ON_HOLD')
      .reduce((acc, s) => acc + s.netAmountCents, 0);

    const practiceFlexSubscribersCount = 1; // Default demo active
    const practiceFlexRevenueCents = 14900;
    const overageRevenueCents = 0;

    return {
      grossBookingValueCents,
      platformFeeRevenueCents,
      gatewayProcessingFeesCents,
      netSettlementObligationsCents,
      weeklySettlementsCount,
      paidSettlementsCount: paidSettlements.length,
      failedSettlementsCount,
      onHoldSettlementsCount,
      totalRefundsCents,
      practiceFlexSubscribersCount,
      practiceFlexRevenueCents,
      overageRevenueCents,
      totalBankAccounts: allBankAccounts.length,
      pendingBankVerifications: allBankAccounts.filter((b) => b.verificationStatus === 'PENDING_VERIFICATION' || b.verificationStatus === 'CHANGE_PENDING').length,
      currency: 'ZAR',
    };
  }
}
