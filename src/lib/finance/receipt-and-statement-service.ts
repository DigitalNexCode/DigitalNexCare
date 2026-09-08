/**
 * DigitalNexCare Receipts & Financial Statements Engine
 * Generates immutable patient payment receipts (DNC-RCP-2026-XXXXXX),
 * weekly settlement statements (DNC-SET-2026-XXXXXX),
 * and monthly practice statements (DNC-STM-2026-XXXXXX).
 */

import {
  PaymentReceipt,
  FinancialStatement,
  FinancialStatementItem,
  StatementType,
} from '../../types/finance';
import { FinancialMath } from './financial-math';
import { BankingService } from './banking-service';
import { SettlementEngine } from './settlement-engine';
import { PracticeCommercialService } from './practice-commercial-service';

export class ReceiptAndStatementService {
  private static receipts = new Map<string, PaymentReceipt>();
  private static statements = new Map<string, FinancialStatement>();
  private static receiptSequence = 1000;
  private static statementSequence = 1000;

  static {
    this.seedDemoReceiptsAndStatements();
  }

  private static seedDemoReceiptsAndStatements() {
    // Seed initial demo patient receipt
    const r1: PaymentReceipt = {
      id: 'rcp_demo_001',
      receiptNumber: 'DNC-RCP-2026-001001',
      paymentReference: 'DNC_PAY_PSTK_9812401',
      appointmentId: 'apt_001',
      patientName: 'Kagiso Sithole',
      patientEmail: 'kagiso.sithole@example.co.za',
      practitionerName: 'Dr. Naledi Mokoena',
      practiceName: 'Mediclinic Hatfield Practice',
      practiceAddress: 'Burnett St, Hatfield, Pretoria, Gauteng',
      appointmentDate: '2026-08-25',
      appointmentTime: '09:00 - 09:30',
      appointmentType: 'General Consultation',
      grossAmountCents: 70000,
      currency: 'ZAR',
      paymentGateway: 'PAYSTACK',
      paymentStatus: 'COMPLETED',
      paidAt: '2026-08-25T09:15:00.000Z',
      supportContact: 'support@digitalnexcare.co.za • +27 12 000 1122',
      termsDisclaimer:
        'DigitalNexCare is an appointment discovery and scheduling platform. Healthcare services are provided independently by the registered practitioner.',
      createdAt: '2026-08-25T09:15:00.000Z',
    };
    this.receipts.set(r1.id, r1);
    this.receipts.set(r1.paymentReference, r1);
    this.receipts.set(r1.appointmentId, r1);

    // Seed weekly settlement statement
    const weeklyStatement: FinancialStatement = {
      id: 'stm_week_001',
      statementNumber: 'DNC-SET-2026-001001',
      statementType: 'WEEKLY_SETTLEMENT',
      practiceId: 'prac-001',
      practiceName: 'Mediclinic Hatfield Practice',
      periodStart: '2026-08-24T00:00:00.000Z',
      periodEnd: '2026-08-30T23:59:59.000Z',
      grossPaidBookingsCents: 205000, // R2,050.00 (3 bookings)
      platformFeesCents: 14350, // 7% = R143.50
      gatewayFeesCents: 6245, // Paystack gateway fees = R62.45
      practiceFlexSubscriptionCents: 0,
      practiceFlexOverageCents: 0,
      totalCompletedPayAtPracticeBookings: 0,
      refundsCents: 0,
      adjustmentsCents: 0,
      netSettlementOrDueCents: 184405, // R1,844.05
      currency: 'ZAR',
      status: 'SETTLED',
      destinationAccountMasked: 'FNB •••• 4821',
      generatedAt: '2026-08-31T06:00:00.000Z',
      items: [
        {
          id: 'item_stm_1',
          statementId: 'stm_week_001',
          date: '2026-08-25',
          description: 'Consultation: Kagiso Sithole (General Consultation)',
          category: 'ONLINE_BOOKING',
          reference: 'DNC-BK-2026-0891',
          amountCents: 70000,
          direction: 'CREDIT',
        },
        {
          id: 'item_stm_2',
          statementId: 'stm_week_001',
          date: '2026-08-26',
          description: 'Consultation: Nomvula Dlamini (Virtual Telehealth)',
          category: 'ONLINE_BOOKING',
          reference: 'DNC-BK-2026-0892',
          amountCents: 65000,
          direction: 'CREDIT',
        },
        {
          id: 'item_stm_3',
          statementId: 'stm_week_001',
          date: '2026-08-28',
          description: 'Consultation: Sipho Zulu (General Consultation)',
          category: 'ONLINE_BOOKING',
          reference: 'DNC-BK-2026-0893',
          amountCents: 70000,
          direction: 'CREDIT',
        },
        {
          id: 'item_stm_4',
          statementId: 'stm_week_001',
          date: '2026-08-30',
          description: 'DigitalNexCare 7% Platform Fee (3 bookings)',
          category: 'PLATFORM_FEE',
          reference: 'DNC-FEE-2026-W35',
          amountCents: 14350,
          direction: 'DEBIT',
        },
        {
          id: 'item_stm_5',
          statementId: 'stm_week_001',
          date: '2026-08-30',
          description: 'Payment Gateway Processing Fees (Paystack)',
          category: 'GATEWAY_FEE',
          reference: 'PSTK-FEE-2026-W35',
          amountCents: 6245,
          direction: 'DEBIT',
        },
      ],
    };
    this.statements.set(weeklyStatement.id, weeklyStatement);
  }

  /**
   * Generate official Patient Payment Receipt after verified payment
   */
  public static generatePaymentReceipt(params: {
    paymentReference: string;
    appointmentId: string;
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
  }): PaymentReceipt {
    const existing = this.receipts.get(params.paymentReference);
    if (existing) return existing;

    const receiptNumber = `DNC-RCP-2026-${(++this.receiptSequence).toString().padStart(6, '0')}`;

    const receipt: PaymentReceipt = {
      id: `rcp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      receiptNumber,
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
      currency: 'ZAR',
      paymentGateway: params.paymentGateway,
      paymentStatus: 'COMPLETED',
      paidAt: new Date().toISOString(),
      supportContact: 'support@digitalnexcare.co.za • +27 12 000 1122',
      termsDisclaimer:
        'DigitalNexCare is an appointment discovery and scheduling platform. Healthcare services are provided independently by the registered practitioner.',
      createdAt: new Date().toISOString(),
    };

    this.receipts.set(receipt.id, receipt);
    this.receipts.set(receipt.paymentReference, receipt);
    this.receipts.set(receipt.appointmentId, receipt);

    return receipt;
  }

  /**
   * Get receipt by appointment ID or payment reference
   */
  public static getReceipt(identifier: string): PaymentReceipt | null {
    return this.receipts.get(identifier) || null;
  }

  /**
   * Generate Weekly Settlement Statement for a Practice
   */
  public static generateWeeklySettlementStatement(
    practiceId: string,
    periodStart: string,
    periodEnd: string
  ): FinancialStatement | null {
    const settlement = SettlementEngine.generateWeeklySettlement(practiceId, periodStart, periodEnd);
    if (!settlement) return null;

    const bank = BankingService.getPracticeBankAccount(practiceId);
    const destinationMasked = bank
      ? FinancialMath.maskBankAndAccount(bank.bankName, bank.accountNumberMasked)
      : 'Bank Account Pending';

    const statementNumber = settlement.settlementNumber;
    const { items: settlementItems } = SettlementEngine.getSettlementDetails(settlement.id);

    const statementItems: FinancialStatementItem[] = [];

    // Add bookings
    for (const item of settlementItems) {
      statementItems.push({
        id: `stm_it_${item.id}`,
        statementId: settlement.id,
        date: item.appointmentDate,
        description: `Consultation: ${item.patientName} (${item.appointmentType})`,
        category: 'ONLINE_BOOKING',
        reference: item.bookingReference,
        amountCents: item.grossAmountCents,
        direction: 'CREDIT',
      });
    }

    // Add 7% platform fee
    if (settlement.platformFeeCents > 0) {
      statementItems.push({
        id: `stm_it_fee_${settlement.id}`,
        statementId: settlement.id,
        date: periodEnd.slice(0, 10),
        description: `DigitalNexCare 7% Platform Fee (${settlement.itemCount} bookings)`,
        category: 'PLATFORM_FEE',
        reference: `DNC-FEE-${settlement.settlementNumber}`,
        amountCents: settlement.platformFeeCents,
        direction: 'DEBIT',
      });
    }

    // Add Gateway Fee
    if (settlement.gatewayFeeCents > 0) {
      statementItems.push({
        id: `stm_it_gw_${settlement.id}`,
        statementId: settlement.id,
        date: periodEnd.slice(0, 10),
        description: `Payment Processing Gateway Fee (${settlement.gateway})`,
        category: 'GATEWAY_FEE',
        reference: `GW-FEE-${settlement.settlementNumber}`,
        amountCents: settlement.gatewayFeeCents,
        direction: 'DEBIT',
      });
    }

    // Add refunds
    if (settlement.refundAmountCents > 0) {
      statementItems.push({
        id: `stm_it_ref_${settlement.id}`,
        statementId: settlement.id,
        date: periodEnd.slice(0, 10),
        description: 'Customer Refunds Processed',
        category: 'REFUND',
        reference: `REF-${settlement.settlementNumber}`,
        amountCents: settlement.refundAmountCents,
        direction: 'DEBIT',
      });
    }

    const statement: FinancialStatement = {
      id: settlement.id,
      statementNumber,
      statementType: 'WEEKLY_SETTLEMENT',
      practiceId,
      practiceName: bank ? bank.businessName : 'Healthcare Practice',
      periodStart,
      periodEnd,
      grossPaidBookingsCents: settlement.grossAmountCents,
      platformFeesCents: settlement.platformFeeCents,
      gatewayFeesCents: settlement.gatewayFeeCents,
      practiceFlexSubscriptionCents: 0,
      practiceFlexOverageCents: 0,
      totalCompletedPayAtPracticeBookings: 0,
      refundsCents: settlement.refundAmountCents,
      adjustmentsCents: settlement.adjustmentAmountCents,
      netSettlementOrDueCents: settlement.netAmountCents,
      currency: 'ZAR',
      status: settlement.status === 'PAID' ? 'SETTLED' : 'PUBLISHED',
      destinationAccountMasked: destinationMasked,
      generatedAt: new Date().toISOString(),
      items: statementItems,
    };

    this.statements.set(statement.id, statement);
    return statement;
  }

  /**
   * Generate Monthly Practice Statement
   * Reconciles: Online bookings, Practice Flex subscription (R149), overage fees (R25/ea),
   * weekly settlements, refunds, and net account balance.
   */
  public static generateMonthlyPracticeStatement(
    practiceId: string,
    year: number,
    month: number // 1-12
  ): FinancialStatement {
    const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString();
    const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59)).toISOString();
    const statementNumber = `DNC-STM-${year}-${month.toString().padStart(2, '0')}-${practiceId.slice(-4)}`;

    const bank = BankingService.getPracticeBankAccount(practiceId);
    const destinationMasked = bank
      ? FinancialMath.maskBankAndAccount(bank.bankName, bank.accountNumberMasked)
      : 'Bank Account Pending';

    // Get online transactions in month
    const allTx = SettlementEngine.getPracticeTransactions(practiceId);
    const startTime = new Date(monthStart).getTime();
    const endTime = new Date(monthEnd).getTime();

    const monthlyTx = allTx.filter((t) => {
      const time = new Date(t.paidAt).getTime();
      return time >= startTime && time <= endTime;
    });

    let grossOnlineCents = 0;
    let platformFeeCents = 0;
    let gatewayFeeCents = 0;
    let refundsCents = 0;

    for (const tx of monthlyTx) {
      const bk = FinancialMath.calculateBookingFeeBreakdown(
        tx.grossAmountCents,
        tx.actualGatewayFeeCents
      );
      grossOnlineCents += bk.grossAmountCents;
      platformFeeCents += bk.platformFeeCents;
      gatewayFeeCents += bk.gatewayFeeCents;
      refundsCents += tx.refundedAmountCents || 0;
    }

    // Get Practice Flex usage in month
    const allowanceUsages = PracticeCommercialService.getAllowanceUsages(practiceId);
    const monthlyQualifyingUsages = allowanceUsages.filter((u) => {
      const time = new Date(u.createdAt).getTime();
      return time >= startTime && time <= endTime && u.isQualifying;
    });

    const completedPayAtPracticeCount = monthlyQualifyingUsages.length;
    const flexCalc = FinancialMath.calculatePracticeFlexMonthlyTotal(completedPayAtPracticeCount);

    // Sum weekly payouts settled
    const settlements = SettlementEngine.getPracticeSettlements(practiceId).filter((s) => {
      const sTime = new Date(s.periodStart).getTime();
      return sTime >= startTime && sTime <= endTime;
    });

    const settledPayoutsCents = settlements.reduce((acc, s) => acc + s.netAmountCents, 0);

    const statementItems: FinancialStatementItem[] = [];

    // 1. Online consultations
    statementItems.push({
      id: `it_m_online_${statementNumber}`,
      statementId: statementNumber,
      date: monthEnd.slice(0, 10),
      description: `Online Consultation Volume (${monthlyTx.length} bookings)`,
      category: 'ONLINE_BOOKING',
      reference: `VOL-${year}-${month}`,
      amountCents: grossOnlineCents,
      direction: 'CREDIT',
    });

    // 2. 7% fee
    if (platformFeeCents > 0) {
      statementItems.push({
        id: `it_m_fee_${statementNumber}`,
        statementId: statementNumber,
        date: monthEnd.slice(0, 10),
        description: 'DigitalNexCare 7% Platform Fees',
        category: 'PLATFORM_FEE',
        reference: `FEE-${year}-${month}`,
        amountCents: platformFeeCents,
        direction: 'DEBIT',
      });
    }

    // 3. Gateway fees
    if (gatewayFeeCents > 0) {
      statementItems.push({
        id: `it_m_gw_${statementNumber}`,
        statementId: statementNumber,
        date: monthEnd.slice(0, 10),
        description: 'Gateway Processing Fees (Paystack)',
        category: 'GATEWAY_FEE',
        reference: `GW-${year}-${month}`,
        amountCents: gatewayFeeCents,
        direction: 'DEBIT',
      });
    }

    // 4. Practice Flex Base
    statementItems.push({
      id: `it_m_flex_${statementNumber}`,
      statementId: statementNumber,
      date: monthStart.slice(0, 10),
      description: 'Practice Flex Base Monthly Subscription (10 included bookings)',
      category: 'FLEX_SUBSCRIPTION',
      reference: `FLEX-${year}-${month}`,
      amountCents: flexCalc.baseCents,
      direction: 'DEBIT',
    });

    // 5. Practice Flex Overage
    if (flexCalc.overageTotalCents > 0) {
      statementItems.push({
        id: `it_m_ovg_${statementNumber}`,
        statementId: statementNumber,
        date: monthEnd.slice(0, 10),
        description: `Practice Flex Overage (${flexCalc.overageCount} bookings @ R25 each)`,
        category: 'FLEX_OVERAGE',
        reference: `OVG-${year}-${month}`,
        amountCents: flexCalc.overageTotalCents,
        direction: 'DEBIT',
      });
    }

    // 6. Settlements paid
    if (settledPayoutsCents > 0) {
      statementItems.push({
        id: `it_m_payout_${statementNumber}`,
        statementId: statementNumber,
        date: monthEnd.slice(0, 10),
        description: `Weekly Settlement Payouts Dispatched (${settlements.length} batches)`,
        category: 'SETTLEMENT_PAYOUT',
        reference: `SET-${year}-${month}`,
        amountCents: settledPayoutsCents,
        direction: 'DEBIT',
      });
    }

    const netSettlementOrDueCents = Math.max(
      0,
      grossOnlineCents -
        platformFeeCents -
        gatewayFeeCents -
        refundsCents -
        flexCalc.totalAmountCents
    );

    const statement: FinancialStatement = {
      id: statementNumber,
      statementNumber,
      statementType: 'MONTHLY_PRACTICE_SUMMARY',
      practiceId,
      practiceName: bank ? bank.businessName : 'Healthcare Practice',
      periodStart: monthStart,
      periodEnd: monthEnd,
      grossPaidBookingsCents: grossOnlineCents,
      platformFeesCents: platformFeeCents,
      gatewayFeesCents: gatewayFeeCents,
      practiceFlexSubscriptionCents: flexCalc.baseCents,
      practiceFlexOverageCents: flexCalc.overageTotalCents,
      totalCompletedPayAtPracticeBookings: completedPayAtPracticeCount,
      refundsCents,
      adjustmentsCents: 0,
      netSettlementOrDueCents,
      currency: 'ZAR',
      status: 'PUBLISHED',
      destinationAccountMasked: destinationMasked,
      generatedAt: new Date().toISOString(),
      items: statementItems,
    };

    this.statements.set(statement.id, statement);
    return statement;
  }

  /**
   * Get all statements for a practice
   */
  public static getPracticeStatements(practiceId: string): FinancialStatement[] {
    return Array.from(this.statements.values()).filter(
      (s) => s.practiceId === practiceId || practiceId === 'all'
    );
  }

  /**
   * Get single statement by ID
   */
  public static getStatement(statementId: string): FinancialStatement | null {
    return this.statements.get(statementId) || null;
  }
}
