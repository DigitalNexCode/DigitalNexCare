/**
 * DigitalNexCare Commercial Configuration Constants
 * CHUNK 9A: Central Commercial Settings & Configurable Pricing
 */

import { CommercialConfig } from '../../types/finance';

export const DEFAULT_COMMERCIAL_CONFIG: CommercialConfig = {
  bookingPlatformFeePercent: 7.0, // 7.00%
  bookingPlatformFeeBasisPoints: 700, // 700 bps = 7%
  practiceFlexMonthlyPriceCents: 14900, // R149.00 in integer cents
  practiceFlexIncludedBookings: 10, // 10 included qualifying pay-at-practice bookings
  practiceFlexOverageCents: 2500, // R25.00 per additional completed booking
  settlementFrequency: 'WEEKLY',
  settlementCutoffDayOfWeek: 0, // Sunday (0) 23:59:59 Africa/Johannesburg
  settlementPayoutDayOfWeek: 1, // Monday (1)
  currency: 'ZAR',
};

export const SUPPORTED_SA_BANKS = [
  'First National Bank (FNB)',
  'Standard Bank',
  'ABSA Bank',
  'Nedbank',
  'Capitec Bank',
  'Discovery Bank',
  'Investec Bank',
  'TymeBank',
  'African Bank',
  'Bidvest Bank',
  'Other',
] as const;

export const STANDARD_SA_BRANCH_CODES: Record<string, string> = {
  'First National Bank (FNB)': '250655',
  'Standard Bank': '051001',
  'ABSA Bank': '632005',
  'Nedbank': '198765',
  'Capitec Bank': '470010',
  'Discovery Bank': '679000',
  'Investec Bank': '580105',
  'TymeBank': '678910',
  'African Bank': '430000',
  'Bidvest Bank': '462005',
};

export const COMMERCIAL_TERMS_VERSION = '2026.1';
