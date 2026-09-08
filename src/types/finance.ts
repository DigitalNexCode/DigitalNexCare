/**
 * DigitalNexCare Financial & Commercial Types
 * CHUNK 9A: Practitioner Payment Model, 7% Platform Fee, Bank Onboarding,
 * Weekly Settlements, Practice Flex Subscriptions & Financial Statements.
 */

export type CurrencyCode = 'ZAR';

export type PaymentMode =
  | 'ONLINE_REQUIRED'
  | 'PAY_AT_PRACTICE'
  | 'ONLINE_OR_PRACTICE'
  | 'DEPOSIT_REQUIRED'
  | 'FREE';

export type BankVerificationStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'FAILED_VERIFICATION'
  | 'CHANGE_PENDING'
  | 'SUSPENDED';

export type BankAccountType = 'CHEQUE_CURRENT' | 'SAVINGS' | 'TRANSMISSION';

export type BankName =
  | 'First National Bank (FNB)'
  | 'Standard Bank'
  | 'ABSA Bank'
  | 'Nedbank'
  | 'Capitec Bank'
  | 'Discovery Bank'
  | 'Investec Bank'
  | 'TymeBank'
  | 'African Bank'
  | 'Bidvest Bank'
  | 'Other';

export interface CommercialConfig {
  bookingPlatformFeePercent: number; // e.g. 7.00
  bookingPlatformFeeBasisPoints: number; // e.g. 700 (7.00%)
  practiceFlexMonthlyPriceCents: number; // e.g. 14900 (R149.00)
  practiceFlexIncludedBookings: number; // e.g. 10
  practiceFlexOverageCents: number; // e.g. 2500 (R25.00)
  settlementFrequency: 'WEEKLY';
  settlementCutoffDayOfWeek: number; // Sunday (0) 23:59:59 Africa/Johannesburg
  settlementPayoutDayOfWeek: number; // Monday (1)
  currency: CurrencyCode;
}

export interface PracticePaymentSettings {
  id: string;
  practiceId: string;
  defaultPaymentMode: PaymentMode;
  allowOnlinePayment: boolean;
  allowPayAtPractice: boolean;
  requiresDepositByDefault: boolean;
  defaultDepositCents?: number;
  acceptsCommercialTerms: boolean;
  termsAcceptedAt?: string;
  termsAcceptedBy?: string;
  termsVersion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentTypePaymentConfig {
  appointmentTypeId: string;
  practiceId: string;
  paymentMode: PaymentMode;
  consultationPriceCents: number;
  depositAmountCents?: number;
  isPriceFixed: boolean;
  isEstimate: boolean;
  currency: CurrencyCode;
}

export interface PracticeBankAccount {
  id: string;
  practiceId: string;
  accountHolderName: string;
  businessName: string;
  bankName: BankName | string;
  accountNumberMasked: string; // e.g. '•••• 4821'
  branchCode: string;
  accountType: BankAccountType;
  billingEmail: string;
  practiceRegistrationNumber: string;
  taxVatNumber?: string;
  paymentContactPerson: string;
  verificationStatus: BankVerificationStatus;
  verificationFailureReason?: string;
  gateway: 'PAYSTACK';
  gatewaySubaccountId?: string;
  gatewaySubaccountCode?: string;
  lastVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankChangeRequest {
  id: string;
  practiceId: string;
  oldAccountMasked: string;
  newAccountMasked: string;
  newBankName: string;
  newBranchCode: string;
  newAccountType: BankAccountType;
  requestedBy: string;
  requestedAt: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export type PracticeFlexStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'GRACE_PERIOD'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'SUSPENDED';

export interface PracticeCommercialSubscription {
  id: string;
  practiceId: string;
  planCode: 'PRACTICE_FLEX';
  status: PracticeFlexStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  includedBookings: number;
  usedBookings: number;
  overageCount: number;
  overageChargeCents: number;
  monthlyBaseCents: number;
  cancelAtPeriodEnd: boolean;
  paymentMethodId?: string;
  lastBilledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PracticeBookingAllowanceUsage {
  id: string;
  practiceId: string;
  appointmentId: string;
  appointmentStatus: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  isQualifying: boolean; // Only completed appointments qualify
  isOverage: boolean;
  overageFeeCents: number;
  createdAt: string;
}

export interface BookingFeeBreakdown {
  grossAmountCents: number;
  platformFeePercent: number; // e.g. 7.00
  platformFeeBasisPoints: number; // e.g. 700
  platformFeeCents: number; // gross * 700 / 10000
  gatewayFeeCents: number;
  gatewayFeeStatus: 'EXACT' | 'PROCESSING_FEE_PENDING';
  practitionerNetAmountCents: number;
  currency: CurrencyCode;
}

export type SettlementStatus =
  | 'DRAFT'
  | 'CALCULATING'
  | 'READY'
  | 'PROCESSING'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'FAILED'
  | 'ON_HOLD'
  | 'REVERSED';

export interface PracticeSettlement {
  id: string;
  settlementNumber: string; // e.g. 'DNC-SET-2026-000001'
  practiceId: string;
  periodStart: string; // Monday 00:00:00
  periodEnd: string; // Sunday 23:59:59
  currency: CurrencyCode;
  grossAmountCents: number;
  platformFeeCents: number;
  gatewayFeeCents: number;
  refundAmountCents: number;
  adjustmentAmountCents: number;
  netAmountCents: number;
  itemCount: number;
  gateway: 'PAYSTACK' | 'YOCO' | 'MANUAL_EFT';
  gatewaySettlementReference?: string;
  status: SettlementStatus;
  calculatedAt: string;
  processingStartedAt?: string;
  paidAt?: string;
  failureReason?: string;
  destinationAccountMasked: string;
  createdAt: string;
  updatedAt: string;
}

export interface PracticeSettlementItem {
  id: string;
  settlementId: string;
  appointmentId: string;
  paymentId: string;
  chargeId: string;
  bookingReference: string;
  patientName: string;
  appointmentType: string;
  appointmentDate: string;
  grossAmountCents: number;
  platformFeeCents: number;
  gatewayFeeCents: number;
  refundCents: number;
  adjustmentCents: number;
  netCents: number;
  createdAt: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string; // e.g. 'DNC-RCP-2026-000001'
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
  currency: CurrencyCode;
  paymentGateway: 'PAYSTACK' | 'YOCO';
  paymentStatus: 'SUCCESS' | 'COMPLETED';
  paidAt: string;
  receiptUrl?: string;
  supportContact: string;
  termsDisclaimer: string;
  createdAt: string;
}

export type StatementType = 'WEEKLY_SETTLEMENT' | 'MONTHLY_PRACTICE_SUMMARY';

export interface FinancialStatementItem {
  id: string;
  statementId: string;
  date: string;
  description: string;
  category:
    | 'ONLINE_BOOKING'
    | 'PLATFORM_FEE'
    | 'GATEWAY_FEE'
    | 'REFUND'
    | 'FLEX_SUBSCRIPTION'
    | 'FLEX_OVERAGE'
    | 'ADJUSTMENT'
    | 'SETTLEMENT_PAYOUT';
  reference: string;
  amountCents: number;
  direction: 'CREDIT' | 'DEBIT';
}

export interface FinancialStatement {
  id: string;
  statementNumber: string; // e.g. 'DNC-SET-2026-000001' or 'DNC-STM-2026-000001'
  statementType: StatementType;
  practiceId: string;
  practiceName: string;
  periodStart: string;
  periodEnd: string;
  grossPaidBookingsCents: number;
  platformFeesCents: number;
  gatewayFeesCents: number;
  practiceFlexSubscriptionCents: number;
  practiceFlexOverageCents: number;
  totalCompletedPayAtPracticeBookings: number;
  refundsCents: number;
  adjustmentsCents: number;
  netSettlementOrDueCents: number;
  currency: CurrencyCode;
  status: 'GENERATED' | 'PUBLISHED' | 'SETTLED' | 'REVISED';
  destinationAccountMasked: string;
  items: FinancialStatementItem[];
  generatedAt: string;
  pdfUrl?: string;
}

export interface ManualFinancialAdjustment {
  id: string;
  practiceId: string;
  adjustmentNumber: string; // e.g. 'DNC-ADJ-2026-000001'
  amountCents: number;
  direction: 'CREDIT' | 'DEBIT';
  reason: string;
  supportingReference: string;
  appliedToSettlementId?: string;
  createdBy: string;
  createdAt: string;
}

export interface CommercialTermsAcceptance {
  id: string;
  practiceId: string;
  termsVersion: string;
  acceptedPlatformFeePercent: number;
  acceptedGatewayPolicy: boolean;
  acceptedSettlementModel: boolean;
  acceptedByUserId: string;
  acceptedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface FinancialAuditLogEntry {
  id: string;
  practiceId?: string;
  actorId: string;
  actorRole: string;
  action:
    | 'BANK_ONBOARDING_SUBMITTED'
    | 'BANK_DETAILS_UPDATED'
    | 'BANK_VERIFIED'
    | 'BANK_VERIFICATION_FAILED'
    | 'TERMS_ACCEPTED'
    | 'PAYMENT_SETTINGS_UPDATED'
    | 'PRICE_CONFIG_UPDATED'
    | 'PAYMENT_PROCESSED'
    | 'REFUND_PROCESSED'
    | 'SETTLEMENT_GENERATED'
    | 'SETTLEMENT_STATUS_CHANGED'
    | 'MANUAL_ADJUSTMENT_CREATED'
    | 'STATEMENT_GENERATED'
    | 'PRACTICE_FLEX_UPDATED';
  details: Record<string, any>;
  timestamp: string;
}

export interface PracticeBalanceOverview {
  grossBookingsThisWeekCents: number;
  platformFeesThisWeekCents: number;
  gatewayFeesThisWeekCents: number;
  refundsThisWeekCents: number;
  estimatedNextSettlementCents: number;
  lastSettlementCents: number;
  lastSettlementDate?: string;
  pendingBalanceCents: number;
  currency: CurrencyCode;
}
