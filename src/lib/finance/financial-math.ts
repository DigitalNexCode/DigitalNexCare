/**
 * DigitalNexCare Integer Financial Math Utilities
 * Strict integer-cents calculations to avoid floating point precision defects.
 */

import { BookingFeeBreakdown, CurrencyCode } from '../../types/finance';
import { DEFAULT_COMMERCIAL_CONFIG } from './finance-constants';

export class FinancialMath {
  /**
   * Calculate 7% (or configured bps/percent) platform fee in integer cents.
   * Accepts either basis points (700) or percentage (7.0).
   * Example: 70000 cents * 700 / 10000 = 4900 cents (R49.00).
   */
  public static calculatePlatformFee(
    grossAmountCents: number,
    platformFeePercentOrBasisPoints: number = DEFAULT_COMMERCIAL_CONFIG.bookingPlatformFeeBasisPoints
  ): number {
    if (grossAmountCents <= 0) return 0;
    const bps =
      platformFeePercentOrBasisPoints <= 100
        ? Math.round(platformFeePercentOrBasisPoints * 100)
        : platformFeePercentOrBasisPoints;
    return Math.round((grossAmountCents * bps) / 10000);
  }

  /**
   * Calculate gateway processing fee in integer cents.
   * Paystack SA local card: 2.9% + 100 cents (R1.00).
   * Yoco SA local card: 2.95%.
   */
  public static calculateGatewayFee(
    grossAmountCents: number,
    gateway: 'PAYSTACK' | 'YOCO' = 'PAYSTACK'
  ): number {
    if (grossAmountCents <= 0) return 0;
    if (gateway === 'PAYSTACK') {
      const variableFee = Math.round((grossAmountCents * 290) / 10000);
      return variableFee + 100;
    } else {
      return Math.round((grossAmountCents * 295) / 10000);
    }
  }

  /**
   * Estimate or calculate Paystack gateway fee for South African transactions
   */
  public static calculateDefaultGatewayFee(grossAmountCents: number): number {
    return this.calculateGatewayFee(grossAmountCents, 'PAYSTACK');
  }

  /**
   * Calculate Practice Flex overage in integer cents.
   */
  public static calculatePracticeFlexOverage(
    usedBookings: number,
    includedBookings: number = DEFAULT_COMMERCIAL_CONFIG.practiceFlexIncludedBookings,
    overageFeeCents: number = DEFAULT_COMMERCIAL_CONFIG.practiceFlexOverageCents
  ): number {
    const extra = Math.max(0, usedBookings - includedBookings);
    return extra * overageFeeCents;
  }

  /**
   * Compute weekly settlement cycle boundaries (Monday 00:00:00 to Sunday 23:59:59 SAST).
   */
  public static getWeeklySettlementWindow(referenceDate: Date = new Date()): {
    periodStart: string;
    periodEnd: string;
  } {
    const d = new Date(referenceDate);
    const day = d.getDay();
    // Monday is 1, Sunday is 0. If Sunday (0), diff is -6; else 1 - day.
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
      periodStart: monday.toISOString(),
      periodEnd: sunday.toISOString(),
    };
  }

  /**
   * Calculate complete booking fee breakdown in integer cents.
   * Practice bears the payment-processing fee.
   */
  public static calculateBookingFeeBreakdown(
    grossAmountCents: number,
    actualGatewayFeeCents?: number,
    platformFeeBasisPoints: number = DEFAULT_COMMERCIAL_CONFIG.bookingPlatformFeeBasisPoints
  ): BookingFeeBreakdown {
    const platformFeeCents = this.calculatePlatformFee(grossAmountCents, platformFeeBasisPoints);
    const hasActualGatewayFee = actualGatewayFeeCents !== undefined && actualGatewayFeeCents >= 0;
    const gatewayFeeCents = hasActualGatewayFee
      ? actualGatewayFeeCents
      : this.calculateDefaultGatewayFee(grossAmountCents);

    const practitionerNetAmountCents = Math.max(
      0,
      grossAmountCents - platformFeeCents - gatewayFeeCents
    );

    return {
      grossAmountCents,
      platformFeePercent: platformFeeBasisPoints / 100,
      platformFeeBasisPoints,
      platformFeeCents,
      gatewayFeeCents,
      gatewayFeeStatus: hasActualGatewayFee ? 'EXACT' : 'PROCESSING_FEE_PENDING',
      practitionerNetAmountCents,
      currency: 'ZAR',
    };
  }

  /**
   * Calculate Practice Flex Monthly Total with Overages
   * Base: R149.00 (14900 cents)
   * Included: 10 qualifying completed bookings
   * Overage: R25.00 (2500 cents) per extra completed booking
   */
  public static calculatePracticeFlexMonthlyTotal(
    completedBookingsCount: number,
    baseCents: number = DEFAULT_COMMERCIAL_CONFIG.practiceFlexMonthlyPriceCents,
    includedBookings: number = DEFAULT_COMMERCIAL_CONFIG.practiceFlexIncludedBookings,
    overageFeeCents: number = DEFAULT_COMMERCIAL_CONFIG.practiceFlexOverageCents
  ): {
    baseCents: number;
    includedBookings: number;
    completedBookingsCount: number;
    overageCount: number;
    overageTotalCents: number;
    totalAmountCents: number;
  } {
    const overageCount = Math.max(0, completedBookingsCount - includedBookings);
    const overageTotalCents = overageCount * overageFeeCents;
    const totalAmountCents = baseCents + overageTotalCents;

    return {
      baseCents,
      includedBookings,
      completedBookingsCount,
      overageCount,
      overageTotalCents,
      totalAmountCents,
    };
  }

  /**
   * Format integer cents to ZAR string (e.g. 70000 -> "R700.00")
   */
  public static formatCentsToZAR(cents: number): string {
    const isNegative = cents < 0;
    const absCents = Math.abs(cents);
    const rands = Math.floor(absCents / 100);
    const remainderCents = absCents % 100;
    const formattedRands = rands.toLocaleString('en-ZA');
    const formattedCents = remainderCents.toString().padStart(2, '0');
    return `${isNegative ? '-' : ''}R${formattedRands}.${formattedCents}`;
  }

  /**
   * Parse ZAR amount to integer cents (e.g. 700 or "700.50" -> 70050)
   */
  public static parseZARToCents(amount: number | string): number {
    if (typeof amount === 'number') {
      return Math.round(amount * 100);
    }
    const cleanStr = amount.replace(/[^0-9.-]+/g, '');
    const floatVal = parseFloat(cleanStr);
    if (isNaN(floatVal)) return 0;
    return Math.round(floatVal * 100);
  }

  /**
   * Mask account number for security: "•••• 4821"
   */
  public static maskAccountNumber(accountNumber: string): string {
    if (!accountNumber) return '•••• 0000';
    const clean = accountNumber.trim().replace(/\s+/g, '');
    if (clean.length <= 4) {
      return `•••• ${clean}`;
    }
    const last4 = clean.slice(-4);
    return `•••• ${last4}`;
  }

  /**
   * Mask bank name + account: "FNB •••• 4821"
   */
  public static maskBankAndAccount(bankName: string, accountNumber: string): string {
    const maskedAcc = this.maskAccountNumber(accountNumber);
    const shortBank = bankName.replace(/\(.*?\)/g, '').trim();
    return `${shortBank} ${maskedAcc}`;
  }
}
