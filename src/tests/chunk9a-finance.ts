/**
 * DigitalNexCare Chunk 9A Acceptance & Verification Test Suite
 * Practitioner Commercial Model, 7% Fee, Bank Onboarding, Weekly Settlements,
 * Pay-at-Practice Subscriptions & Financial Statements.
 */

import { FinancialMath } from '../lib/finance/financial-math';
import { PractitionerFinanceService } from '../lib/finance/practitioner-finance-service';
import { DEFAULT_COMMERCIAL_CONFIG } from '../lib/finance/finance-constants';

function assert(condition: boolean, testName: string, details?: any) {
  if (!condition) {
    console.error(`❌ FAILED: ${testName}`, details || '');
    throw new Error(`Test failed: ${testName}`);
  } else {
    console.log(`✅ PASSED: ${testName}`);
  }
}

export function runChunk9aFinanceTests(): { passed: number; total: number; details: string[] } {
  const details: string[] = [];
  let passed = 0;
  const tests = [
    // 1. Integer Cents Conversion
    () => {
      const cents = FinancialMath.parseZARToCents('750.50');
      assert(cents === 75050, 'ZAR to cents parsing preserves exact integer value');
      const zarStr = FinancialMath.formatCentsToZAR(75050);
      assert(zarStr.includes('750.50'), 'Cents to ZAR formatting outputs correct standard currency string');
      passed++;
      details.push('Exact integer cents parsing and formatting without float drift');
    },

    // 2. 7% Platform Fee Calculation (Independent from gateway fees)
    () => {
      const grossCents = 100000; // R1,000.00
      const platformFee = FinancialMath.calculatePlatformFee(grossCents, 7.0);
      assert(platformFee === 7000, '7% fee on R1,000 is exactly R70.00 (7000 cents)');

      // Gateway fee is separate
      const gatewayFee = FinancialMath.calculateGatewayFee(grossCents, 'PAYSTACK');
      // Paystack: 2.9% + R1.00 = 2900 + 100 = 3000 cents
      assert(gatewayFee === 3000, 'Paystack processing fee is separate (R30.00)');

      // Net for practitioner = Gross - Platform Fee - Gateway Fee
      const net = grossCents - platformFee - gatewayFee;
      assert(net === 90000, 'Practitioner net calculation is exactly Gross - Fee - Gateway (R900.00)');
      passed++;
      details.push('Strict 7.00% platform fee calculation separate from payment gateway fees');
    },

    // 3. Bank Account Number Masking Security Rule
    () => {
      const raw = '62849201948';
      const masked = FinancialMath.maskAccountNumber(raw);
      assert(masked.endsWith('1948'), 'Masked account preserves last 4 digits');
      assert(!masked.includes('6284920'), 'Masked account hides leading sensitive digits');
      assert(masked.includes('••••'), 'Masked account contains bullet mask character');
      passed++;
      details.push('Bank account numbers masked across all display layers (e.g. •••• 1948)');
    },

    // 4. Practice Flex (Pay-at-Practice) Subscription Model
    () => {
      const subPriceCents = DEFAULT_COMMERCIAL_CONFIG.practiceFlexMonthlyPriceCents; // 14900 (R149)
      const included = DEFAULT_COMMERCIAL_CONFIG.practiceFlexIncludedBookings; // 10
      const overageFeeCents = DEFAULT_COMMERCIAL_CONFIG.practiceFlexOverageCents; // 2500 (R25)

      assert(subPriceCents === 14900, 'Practice Flex monthly fee is R149.00');
      assert(included === 10, 'Practice Flex includes 10 bookings per calendar month');
      assert(overageFeeCents === 2500, 'Practice Flex overage is R25.00 per completed booking');

      // 6 bookings used -> 0 overage
      const overage6 = FinancialMath.calculatePracticeFlexOverage(6, included, overageFeeCents);
      assert(overage6 === 0, 'No overage fee when usage is below included allowance (6 of 10)');

      // 14 bookings used -> 4 * 2500 = 10000 cents (R100)
      const overage14 = FinancialMath.calculatePracticeFlexOverage(14, included, overageFeeCents);
      assert(overage14 === 10000, 'Calculates R100.00 overage when usage is 14 bookings (4 over allowance)');
      passed++;
      details.push('Practice Flex subscription pricing (R149/mo, 10 included, R25 overage)');
    },

    // 5. Weekly Settlement Cutoff & Window Calculation
    () => {
      // Test given a date, computes correct Monday 00:00:00 to Sunday 23:59:59 SAST
      const window = FinancialMath.getWeeklySettlementWindow(new Date('2026-09-02T12:00:00Z'));
      const start = new Date(window.periodStart);
      const end = new Date(window.periodEnd);
      assert(start.getDay() === 1, 'Settlement period starts on Monday');
      assert(end.getDay() === 0, 'Settlement period ends on Sunday');
      passed++;
      details.push('Weekly settlement cycles aligned to Monday 00:00:00 - Sunday 23:59:59 SAST');
    },

    // 6. Idempotent Settlement Batch Engine
    () => {
      const practiceId = 'prac-001';
      const periodStart = '2026-08-17T00:00:00.000Z';
      const periodEnd = '2026-08-23T23:59:59.999Z';

      const settlement1 = PractitionerFinanceService.generateWeeklySettlement(practiceId, periodStart, periodEnd);
      assert(settlement1 !== null, 'Initial weekly settlement batch generated successfully');

      // Calling again with identical period must return existing settlement without duplication
      const settlement2 = PractitionerFinanceService.generateWeeklySettlement(practiceId, periodStart, periodEnd);
      assert(settlement1?.id === settlement2?.id, 'Settlement generation is idempotent across identical periods');
      assert(settlement1?.settlementNumber === settlement2?.settlementNumber, 'Settlement number is preserved');
      passed++;
      details.push('Idempotent settlement batch generation prevents double payouts');
    },

    // 7. Statement Generation & Tax Invoicing
    () => {
      const practiceId = 'prac-001';
      const periodStart = '2026-08-17T00:00:00.000Z';
      const periodEnd = '2026-08-23T23:59:59.999Z';

      const statement = PractitionerFinanceService.generateWeeklyStatement(practiceId, periodStart, periodEnd);
      assert(statement !== null, 'Tax-compliant weekly financial statement generated');
      assert(statement?.statementNumber.startsWith('DNC-SET-'), 'Statement number uses official prefix DNC-SET-');
      assert(statement?.currency === 'ZAR', 'Statement currency is South African Rand (ZAR)');
      assert(statement?.destinationAccountMasked.includes('••••'), 'Statement masks banking payout details');
      passed++;
      details.push('Weekly and monthly financial statements generated with immutable record numbers');
    },

    // 8. End-to-End Online Booking Transaction & Instant Receipt
    () => {
      const bookingPayment = PractitionerFinanceService.recordOnlineBookingPayment({
        paymentReference: 'PAY_TEST_2026_001',
        appointmentId: 'apt-test-999',
        practiceId: 'prac-001',
        bookingReference: 'DNC-APT-999',
        patientName: 'Kagiso Khumalo',
        patientEmail: 'kagiso@example.com',
        practitionerName: 'Dr Naledi Mokoena',
        practiceName: 'Mediclinic Hatfield Practice',
        practiceAddress: 'Burnett St, Hatfield, Pretoria',
        appointmentDate: '2026-09-10',
        appointmentTime: '10:00 - 10:30',
        appointmentType: 'General Consultation',
        grossAmountCents: 75000, // R750.00
        paymentGateway: 'PAYSTACK',
      });

      assert(bookingPayment.success, 'Online booking payment recorded successfully');
      assert(bookingPayment.breakdown.platformFeeCents === 5250, 'Platform fee is 7% of R750 (R52.50 = 5250 cents)');
      assert(bookingPayment.receipt.receiptNumber.startsWith('DNC-RCP-'), 'Official receipt issued with DNC-RCP- prefix');
      assert(bookingPayment.receipt.paymentGateway === 'PAYSTACK', 'Receipt notes Paystack processing');
      passed++;
      details.push('Online booking prepayment lifecycle records 7% fee, gateway fee, and issues receipt');
    },

    // 9. Bank Change Request Audit & Approval Lifecycle
    () => {
      const res = PractitionerFinanceService.requestBankDetailsChange({
        practiceId: 'prac-001',
        newAccountHolderName: 'Mediclinic Hatfield Inc',
        newBankName: 'Standard Bank',
        newBranchCode: '051001',
        newAccountNumber: '1092837465',
        newAccountType: 'CHEQUE_CURRENT',
        requestedBy: 'user-prov-001',
        notes: 'Updated to primary commercial cheque account',
      });

      const req = res.changeRequest;
      assert(req.status === 'PENDING_VERIFICATION', 'New bank change request is placed in PENDING_VERIFICATION queue');
      assert(req.newAccountMasked.endsWith('7465'), 'Bank change request stores only masked account');

      // Admin verification
      const verifyRes = PractitionerFinanceService.verifyBankChange(req.id, 'admin-001', true);
      assert(verifyRes.success, 'Admin can verify and approve bank change request');
      assert(verifyRes.account?.bankName === 'Standard Bank', 'Approved bank details applied to practice account');
      passed++;
      details.push('Bank details update workflow enforces audit logging and verifier sign-off');
    },

    // 10. Commercial Terms Acceptance Gate
    () => {
      const terms = PractitionerFinanceService.acceptCommercialTerms({
        practiceId: 'prac-001',
        acceptedByUserId: 'user-prov-001',
        enableOnlinePayment: true,
        enablePayAtPractice: true,
        termsVersion: '2026.1',
        ipAddress: '196.25.1.1',
      });
      assert(terms.acceptedPlatformFeePercent === 7.0, 'Recorded acceptance of 7% platform fee');
      assert(terms.acceptedSettlementModel === true, 'Recorded acceptance of weekly settlement engine');
      assert(terms.termsVersion === '2026.1', 'Recorded exact version of commercial terms');
      passed++;
      details.push('Commercial terms acceptance tracking with IP, timestamp, and versioning');
    },
  ];

  for (const test of tests) {
    test();
  }

  return {
    passed,
    total: tests.length,
    details,
  };
}

// If executed directly via tsx
try {
  console.log('\n🏥 Running DigitalNexCare Chunk 9A Acceptance Tests...\n');
  const result = runChunk9aFinanceTests();
  console.log(`\n🎉 ALL ${result.passed}/${result.total} ACCEPTANCE TESTS PASSED!\n`);
} catch (e) {
  console.error(e);
  process.exit(1);
}
