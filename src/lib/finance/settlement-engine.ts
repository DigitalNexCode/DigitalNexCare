/**
 * DigitalNexCare Weekly Settlement Engine
 * Calculates weekly practice settlements, enforces idempotency, prevents duplicate payouts,
 * separates 7% platform fee from gateway processing fee, and manages post-settlement adjustments.
 */

import {
  PracticeSettlement,
  PracticeSettlementItem,
  SettlementStatus,
  ManualFinancialAdjustment,
  PracticeBalanceOverview,
} from '../../types/finance';
import { BankingService } from './banking-service';
import { FinancialMath } from './financial-math';
import { DEFAULT_COMMERCIAL_CONFIG } from './finance-constants';

export interface EligiblePaymentTransaction {
  paymentId: string;
  appointmentId: string;
  practiceId: string;
  bookingReference: string;
  patientName: string;
  appointmentType: string;
  appointmentDate: string;
  grossAmountCents: number;
  actualGatewayFeeCents?: number;
  paidAt: string;
  status: 'SUCCESS' | 'COMPLETED';
  settlementId?: string; // set once settled
  refundedAmountCents?: number;
}

export class SettlementEngine {
  private static settlements = new Map<string, PracticeSettlement>(); // key: settlementId or practiceId_periodKey
  private static settlementItems = new Map<string, PracticeSettlementItem[]>(); // key: settlementId
  private static recordedTransactions = new Map<string, EligiblePaymentTransaction>(); // key: paymentId
  private static manualAdjustments = new Map<string, ManualFinancialAdjustment[]>(); // key: practiceId
  private static settlementCounter = 1000;

  static {
    this.seedDemoSettlements();
  }

  private static seedDemoSettlements() {
    // Seed sample transactions for practice 'prac-001'
    const now = new Date();
    const lastWeekStart = new Date(now.getTime() - 12 * 86400000);
    const lastWeekEnd = new Date(now.getTime() - 5 * 86400000);

    const tx1: EligiblePaymentTransaction = {
      paymentId: 'pay_tx_001',
      appointmentId: 'apt_001',
      practiceId: 'prac-001',
      bookingReference: 'DNC-BK-2026-0891',
      patientName: 'Kagiso Sithole',
      appointmentType: 'General Consultation',
      appointmentDate: '2026-08-25',
      grossAmountCents: 70000, // R700.00
      actualGatewayFeeCents: 2130, // R21.30
      paidAt: '2026-08-25T09:15:00.000Z',
      status: 'SUCCESS',
      refundedAmountCents: 0,
    };

    const tx2: EligiblePaymentTransaction = {
      paymentId: 'pay_tx_002',
      appointmentId: 'apt_002',
      practiceId: 'prac-001',
      bookingReference: 'DNC-BK-2026-0892',
      patientName: 'Nomvula Dlamini',
      appointmentType: 'Virtual Telehealth',
      appointmentDate: '2026-08-26',
      grossAmountCents: 65000, // R650.00
      actualGatewayFeeCents: 1985, // R19.85
      paidAt: '2026-08-26T11:30:00.000Z',
      status: 'SUCCESS',
      refundedAmountCents: 0,
    };

    const tx3: EligiblePaymentTransaction = {
      paymentId: 'pay_tx_003',
      appointmentId: 'apt_003',
      practiceId: 'prac-001',
      bookingReference: 'DNC-BK-2026-0893',
      patientName: 'Sipho Zulu',
      appointmentType: 'General Consultation',
      appointmentDate: '2026-08-28',
      grossAmountCents: 70000, // R700.00
      actualGatewayFeeCents: 2130, // R21.30
      paidAt: '2026-08-28T14:45:00.000Z',
      status: 'SUCCESS',
      refundedAmountCents: 0,
    };

    this.recordOnlinePaymentTransaction(tx1);
    this.recordOnlinePaymentTransaction(tx2);
    this.recordOnlinePaymentTransaction(tx3);

    // Generate seeded settled weekly batch for last week
    const pStartStr = '2026-08-24T00:00:00.000Z';
    const pEndStr = '2026-08-30T23:59:59.000Z';
    const seededSettlement = this.generateWeeklySettlement('prac-001', pStartStr, pEndStr);
    if (seededSettlement) {
      seededSettlement.status = 'PAID';
      seededSettlement.paidAt = '2026-08-31T06:00:00.000Z';
      seededSettlement.gatewaySettlementReference = 'PSTK_SETTLE_9812401';
      this.settlements.set(seededSettlement.id, seededSettlement);
    }
  }

  /**
   * Record a verified successful online booking payment transaction
   */
  public static recordOnlinePaymentTransaction(
    tx: EligiblePaymentTransaction
  ): EligiblePaymentTransaction {
    this.recordedTransactions.set(tx.paymentId, tx);
    return tx;
  }

  /**
   * Get all transactions for a practice
   */
  public static getPracticeTransactions(practiceId: string): EligiblePaymentTransaction[] {
    return Array.from(this.recordedTransactions.values()).filter(
      (tx) => tx.practiceId === practiceId || practiceId === 'all'
    );
  }

  /**
   * Get current weekly period bounds (Monday 00:00:00 to Sunday 23:59:59 Africa/Johannesburg)
   */
  public static getCurrentWeeklyPeriod(referenceDate: Date = new Date()): {
    periodStart: string;
    periodEnd: string;
    periodKey: string;
  } {
    const d = new Date(referenceDate);
    const day = d.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = (day === 0 ? -6 : 1) - day;

    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const periodKey = `${monday.toISOString().slice(0, 10)}_${sunday.toISOString().slice(0, 10)}`;

    return {
      periodStart: monday.toISOString(),
      periodEnd: sunday.toISOString(),
      periodKey,
    };
  }

  /**
   * Generate Weekly Settlement for a Practice
   * IDEMPOTENT: Uses unique key (practiceId + periodStart + periodEnd).
   * Repeated calls return the existing settlement without duplicating batches or items.
   */
  public static generateWeeklySettlement(
    practiceId: string,
    periodStart: string,
    periodEnd: string,
    forceRecalculateDraft: boolean = false
  ): PracticeSettlement | null {
    const idempotencyKey = `${practiceId}__${periodStart.slice(0, 10)}__${periodEnd.slice(0, 10)}`;

    // Check if settlement already exists for this period
    const existing = Array.from(this.settlements.values()).find(
      (s) =>
        s.practiceId === practiceId &&
        s.periodStart.slice(0, 10) === periodStart.slice(0, 10) &&
        s.periodEnd.slice(0, 10) === periodEnd.slice(0, 10)
    );

    if (existing && !forceRecalculateDraft) {
      return existing;
    }

    if (existing && existing.status !== 'DRAFT' && existing.status !== 'CALCULATING') {
      // Cannot overwrite paid, ready, or processing settlements
      return existing;
    }

    const bankAccount = BankingService.getPracticeBankAccount(practiceId);
    const destinationMasked = bankAccount
      ? FinancialMath.maskBankAndAccount(bankAccount.bankName, bankAccount.accountNumberMasked)
      : 'Bank Account Pending';

    // Find eligible transactions in this period not settled elsewhere
    const startTime = new Date(periodStart).getTime();
    const endTime = new Date(periodEnd).getTime();

    const candidateTransactions = Array.from(this.recordedTransactions.values()).filter((tx) => {
      if (tx.practiceId !== practiceId) return false;
      const txTime = new Date(tx.paidAt).getTime();
      const inTimeRange = txTime >= startTime && txTime <= endTime;
      // Not already settled in a different settlement
      const notSettledElseWhere = !tx.settlementId || (existing && tx.settlementId === existing.id);
      return inTimeRange && notSettledElseWhere;
    });

    const settlementId = existing ? existing.id : `settle_${Date.now()}_${++this.settlementCounter}`;
    const settlementNumber = existing
      ? existing.settlementNumber
      : `DNC-SET-2026-${this.settlementCounter.toString().padStart(6, '0')}`;

    let grossTotalCents = 0;
    let platformFeeTotalCents = 0;
    let gatewayFeeTotalCents = 0;
    let refundTotalCents = 0;

    const settlementItems: PracticeSettlementItem[] = [];

    for (const tx of candidateTransactions) {
      const breakdown = FinancialMath.calculateBookingFeeBreakdown(
        tx.grossAmountCents,
        tx.actualGatewayFeeCents
      );

      const refundedCents = tx.refundedAmountCents || 0;
      const netCents = Math.max(
        0,
        breakdown.grossAmountCents -
          breakdown.platformFeeCents -
          breakdown.gatewayFeeCents -
          refundedCents
      );

      grossTotalCents += breakdown.grossAmountCents;
      platformFeeTotalCents += breakdown.platformFeeCents;
      gatewayFeeTotalCents += breakdown.gatewayFeeCents;
      refundTotalCents += refundedCents;

      // Mark transaction with settlement ID
      tx.settlementId = settlementId;

      const item: PracticeSettlementItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        settlementId,
        appointmentId: tx.appointmentId,
        paymentId: tx.paymentId,
        chargeId: `chg_${tx.paymentId}`,
        bookingReference: tx.bookingReference,
        patientName: tx.patientName,
        appointmentType: tx.appointmentType,
        appointmentDate: tx.appointmentDate,
        grossAmountCents: breakdown.grossAmountCents,
        platformFeeCents: breakdown.platformFeeCents,
        gatewayFeeCents: breakdown.gatewayFeeCents,
        refundCents: refundedCents,
        adjustmentCents: 0,
        netCents,
        createdAt: new Date().toISOString(),
      };
      settlementItems.push(item);
    }

    // Apply pending manual adjustments (credits/debits)
    const practiceAdjustments = this.manualAdjustments.get(practiceId) || [];
    let adjustmentTotalCents = 0;
    for (const adj of practiceAdjustments) {
      if (!adj.appliedToSettlementId) {
        adj.appliedToSettlementId = settlementId;
        const adjAmount = adj.direction === 'CREDIT' ? adj.amountCents : -adj.amountCents;
        adjustmentTotalCents += adjAmount;
      }
    }

    const netSettlementCents = Math.max(
      0,
      grossTotalCents -
        platformFeeTotalCents -
        gatewayFeeTotalCents -
        refundTotalCents +
        adjustmentTotalCents
    );

    // Initial status: READY if bank verified and net > 0, otherwise ON_HOLD
    const isBankVerified = bankAccount?.verificationStatus === 'VERIFIED';
    const status: SettlementStatus = isBankVerified
      ? netSettlementCents > 0
        ? 'READY'
        : 'DRAFT'
      : 'ON_HOLD';

    const settlement: PracticeSettlement = {
      id: settlementId,
      settlementNumber,
      practiceId,
      periodStart,
      periodEnd,
      currency: 'ZAR',
      grossAmountCents: grossTotalCents,
      platformFeeCents: platformFeeTotalCents,
      gatewayFeeCents: gatewayFeeTotalCents,
      refundAmountCents: refundTotalCents,
      adjustmentAmountCents: adjustmentTotalCents,
      netAmountCents: netSettlementCents,
      itemCount: settlementItems.length,
      gateway: 'PAYSTACK',
      status,
      calculatedAt: new Date().toISOString(),
      destinationAccountMasked: destinationMasked,
      failureReason: !isBankVerified ? 'Practice bank account pending verification' : undefined,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.settlements.set(settlement.id, settlement);
    this.settlementItems.set(settlement.id, settlementItems);

    return settlement;
  }

  /**
   * Process and finalize payout for a settlement batch
   */
  public static markSettlementPaid(
    settlementId: string,
    gatewayReference: string = `PSTK_SETTLE_${Math.random().toString(36).substring(2, 9).toUpperCase()}`
  ): { success: boolean; settlement: PracticeSettlement | null; error?: string } {
    const settlement = this.settlements.get(settlementId);
    if (!settlement) return { success: false, settlement: null, error: 'Settlement not found' };

    const bank = BankingService.getPracticeBankAccount(settlement.practiceId);
    if (!bank || bank.verificationStatus !== 'VERIFIED') {
      settlement.status = 'ON_HOLD';
      settlement.failureReason = 'Bank verification required before payout';
      settlement.updatedAt = new Date().toISOString();
      return {
        success: false,
        settlement,
        error: 'Cannot pay settlement to unverified bank account',
      };
    }

    settlement.status = 'PAID';
    settlement.paidAt = new Date().toISOString();
    settlement.gatewaySettlementReference = gatewayReference;
    settlement.updatedAt = new Date().toISOString();
    this.settlements.set(settlementId, settlement);

    return { success: true, settlement };
  }

  /**
   * Mark payout as failed (e.g. gateway reject or invalid account)
   */
  public static markSettlementFailed(
    settlementId: string,
    failureReason: string
  ): PracticeSettlement | null {
    const settlement = this.settlements.get(settlementId);
    if (!settlement) return null;

    settlement.status = 'FAILED';
    settlement.failureReason = failureReason;
    settlement.updatedAt = new Date().toISOString();
    this.settlements.set(settlementId, settlement);
    return settlement;
  }

  /**
   * Process refund on an online booking payment
   * Handles pre-settlement and post-settlement scenarios.
   */
  public static processPaymentRefund(params: {
    paymentId: string;
    refundAmountCents: number;
    reason: string;
    adminUserId: string;
  }): {
    success: boolean;
    isPostSettlement: boolean;
    adjustmentCreated?: ManualFinancialAdjustment;
    error?: string;
  } {
    const tx = this.recordedTransactions.get(params.paymentId);
    if (!tx) return { success: false, isPostSettlement: false, error: 'Payment record not found' };

    const currentRefunded = tx.refundedAmountCents || 0;
    if (currentRefunded + params.refundAmountCents > tx.grossAmountCents) {
      return {
        success: false,
        isPostSettlement: false,
        error: 'Refund amount exceeds remaining payment balance',
      };
    }

    tx.refundedAmountCents = currentRefunded + params.refundAmountCents;

    // Check if the transaction is part of an already PAID/SETTLED batch
    let isPostSettlement = false;
    let adjustment: ManualFinancialAdjustment | undefined;

    if (tx.settlementId) {
      const existingSettlement = this.settlements.get(tx.settlementId);
      if (existingSettlement && (existingSettlement.status === 'PAID' || existingSettlement.status === 'PROCESSING')) {
        isPostSettlement = true;

        // Post-settlement refund: create a DEBIT adjustment against the practice's next settlement
        adjustment = this.createManualAdjustment({
          practiceId: tx.practiceId,
          amountCents: params.refundAmountCents,
          direction: 'DEBIT',
          reason: `Post-settlement refund for booking ${tx.bookingReference}: ${params.reason}`,
          supportingReference: tx.bookingReference,
          createdBy: params.adminUserId,
        });
      } else if (existingSettlement && existingSettlement.status === 'DRAFT') {
        // Pre-settlement refund in DRAFT: recalculate draft
        this.generateWeeklySettlement(
          existingSettlement.practiceId,
          existingSettlement.periodStart,
          existingSettlement.periodEnd,
          true
        );
      }
    }

    return { success: true, isPostSettlement, adjustmentCreated: adjustment };
  }

  /**
   * Create a manual financial adjustment (credit or debit)
   */
  public static createManualAdjustment(params: {
    practiceId: string;
    amountCents: number;
    direction: 'CREDIT' | 'DEBIT';
    reason: string;
    supportingReference: string;
    createdBy: string;
  }): ManualFinancialAdjustment {
    const adj: ManualFinancialAdjustment = {
      id: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      practiceId: params.practiceId,
      adjustmentNumber: `DNC-ADJ-${Date.now().toString().slice(-6)}`,
      amountCents: params.amountCents,
      direction: params.direction,
      reason: params.reason,
      supportingReference: params.supportingReference,
      createdBy: params.createdBy,
      createdAt: new Date().toISOString(),
    };

    const list = this.manualAdjustments.get(params.practiceId) || [];
    list.push(adj);
    this.manualAdjustments.set(params.practiceId, list);
    return adj;
  }

  /**
   * Get practice settlements
   */
  public static getPracticeSettlements(practiceId: string): PracticeSettlement[] {
    return Array.from(this.settlements.values()).filter(
      (s) => s.practiceId === practiceId || practiceId === 'all'
    );
  }

  /**
   * Get settlement by ID with line items
   */
  public static getSettlementDetails(settlementId: string): {
    settlement: PracticeSettlement | null;
    items: PracticeSettlementItem[];
  } {
    const settlement = this.settlements.get(settlementId) || null;
    const items = this.settlementItems.get(settlementId) || [];
    return { settlement, items };
  }

  /**
   * Get practice live balance overview
   */
  public static getPracticeBalanceOverview(practiceId: string): PracticeBalanceOverview {
    const { periodStart, periodEnd } = this.getCurrentWeeklyPeriod();
    const startTime = new Date(periodStart).getTime();
    const endTime = new Date(periodEnd).getTime();

    const thisWeekTx = Array.from(this.recordedTransactions.values()).filter((tx) => {
      if (tx.practiceId !== practiceId) return false;
      const txTime = new Date(tx.paidAt).getTime();
      return txTime >= startTime && txTime <= endTime;
    });

    let grossThisWeek = 0;
    let platformFeeThisWeek = 0;
    let gatewayFeeThisWeek = 0;
    let refundsThisWeek = 0;

    for (const tx of thisWeekTx) {
      const bk = FinancialMath.calculateBookingFeeBreakdown(
        tx.grossAmountCents,
        tx.actualGatewayFeeCents
      );
      grossThisWeek += bk.grossAmountCents;
      platformFeeThisWeek += bk.platformFeeCents;
      gatewayFeeThisWeek += bk.gatewayFeeCents;
      refundsThisWeek += tx.refundedAmountCents || 0;
    }

    const estimatedNextSettlement = Math.max(
      0,
      grossThisWeek - platformFeeThisWeek - gatewayFeeThisWeek - refundsThisWeek
    );

    // Find last settlement
    const pastSettlements = Array.from(this.settlements.values())
      .filter((s) => s.practiceId === practiceId && s.status === 'PAID')
      .sort((a, b) => new Date(b.paidAt || 0).getTime() - new Date(a.paidAt || 0).getTime());

    const lastSettlement = pastSettlements[0];

    return {
      grossBookingsThisWeekCents: grossThisWeek,
      platformFeesThisWeekCents: platformFeeThisWeek,
      gatewayFeesThisWeekCents: gatewayFeeThisWeek,
      refundsThisWeekCents: refundsThisWeek,
      estimatedNextSettlementCents: estimatedNextSettlement,
      lastSettlementCents: lastSettlement ? lastSettlement.netAmountCents : 0,
      lastSettlementDate: lastSettlement?.paidAt,
      pendingBalanceCents: estimatedNextSettlement,
      currency: 'ZAR',
    };
  }
}
