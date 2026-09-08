/**
 * DigitalNexCare Banking & Payout Destination Service
 * Handles sensitive bank onboarding, Paystack subaccount linkage,
 * account masking, verification states, and change audits.
 */

import {
  PracticeBankAccount,
  BankChangeRequest,
  BankVerificationStatus,
  BankAccountType,
  BankName,
} from '../../types/finance';
import { FinancialMath } from './financial-math';
import { STANDARD_SA_BRANCH_CODES } from './finance-constants';

export class BankingService {
  private static accounts = new Map<string, PracticeBankAccount>();
  private static changeRequests = new Map<string, BankChangeRequest>();

  static {
    this.seedDefaultDemoAccounts();
  }

  private static seedDefaultDemoAccounts() {
    // Seed default practice bank account for primary demo practice (Mediclinic Hatfield / Dr Mokoena)
    const demoAcc: PracticeBankAccount = {
      id: 'bnk_demo_001',
      practiceId: 'prac-001',
      accountHolderName: 'Hatfield Family Health Inc',
      businessName: 'Mediclinic Hatfield Practice',
      bankName: 'First National Bank (FNB)',
      accountNumberMasked: '•••• 4821',
      branchCode: '250655',
      accountType: 'CHEQUE_CURRENT',
      billingEmail: 'billing@hatfieldhealth.co.za',
      practiceRegistrationNumber: 'PR-2024-00921',
      taxVatNumber: '4820194821',
      paymentContactPerson: 'Sister Elmarie van der Merwe',
      verificationStatus: 'VERIFIED',
      gateway: 'PAYSTACK',
      gatewaySubaccountId: 'sub_pstk_hatfield_001',
      gatewaySubaccountCode: 'ACCT_8z9x21p9q8',
      lastVerifiedAt: '2026-08-15T10:00:00.000Z',
      createdAt: '2026-08-01T08:30:00.000Z',
      updatedAt: '2026-08-15T10:00:00.000Z',
    };
    this.accounts.set(demoAcc.practiceId, demoAcc);
    this.accounts.set('default', demoAcc);
  }

  /**
   * Get practice bank account with masked numbers
   */
  public static getPracticeBankAccount(practiceId: string): PracticeBankAccount | null {
    return this.accounts.get(practiceId) || this.accounts.get('default') || null;
  }

  /**
   * Submit bank details for financial onboarding
   */
  public static submitBankOnboarding(params: {
    practiceId: string;
    accountHolderName: string;
    businessName: string;
    bankName: BankName | string;
    accountNumber: string;
    branchCode?: string;
    accountType: BankAccountType;
    billingEmail: string;
    practiceRegistrationNumber: string;
    taxVatNumber?: string;
    paymentContactPerson: string;
    userId: string;
  }): PracticeBankAccount {
    const maskedNumber = FinancialMath.maskAccountNumber(params.accountNumber);
    const resolvedBranchCode =
      params.branchCode ||
      STANDARD_SA_BRANCH_CODES[params.bankName] ||
      '000000';

    // Mock Paystack subaccount generation for marketplace split
    const subaccountCode = `ACCT_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const newAccount: PracticeBankAccount = {
      id: `bnk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      practiceId: params.practiceId,
      accountHolderName: params.accountHolderName.trim(),
      businessName: params.businessName.trim(),
      bankName: params.bankName,
      accountNumberMasked: maskedNumber,
      branchCode: resolvedBranchCode,
      accountType: params.accountType,
      billingEmail: params.billingEmail.trim().toLowerCase(),
      practiceRegistrationNumber: params.practiceRegistrationNumber.trim(),
      taxVatNumber: params.taxVatNumber?.trim(),
      paymentContactPerson: params.paymentContactPerson.trim(),
      verificationStatus: 'PENDING_VERIFICATION',
      gateway: 'PAYSTACK',
      gatewaySubaccountId: `sub_pstk_${params.practiceId}`,
      gatewaySubaccountCode: subaccountCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.accounts.set(params.practiceId, newAccount);
    return newAccount;
  }

  /**
   * Request Bank Details Change
   * Protects payout destination: does not silently change active account.
   * Enters CHANGE_PENDING status until approved/verified.
   */
  public static requestBankDetailsChange(params: {
    practiceId: string;
    newAccountHolderName: string;
    newBankName: BankName | string;
    newAccountNumber: string;
    newBranchCode?: string;
    newAccountType: BankAccountType;
    requestedBy: string;
    notes?: string;
  }): { changeRequest: BankChangeRequest; updatedAccount: PracticeBankAccount } {
    const currentAccount = this.getPracticeBankAccount(params.practiceId);
    const oldAccountMasked = currentAccount ? currentAccount.accountNumberMasked : '•••• 0000';
    const newAccountMasked = FinancialMath.maskAccountNumber(params.newAccountNumber);
    const resolvedBranch =
      params.newBranchCode || STANDARD_SA_BRANCH_CODES[params.newBankName] || '000000';

    const changeRequest: BankChangeRequest = {
      id: `bnk_chg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      practiceId: params.practiceId,
      oldAccountMasked,
      newAccountMasked,
      newBankName: params.newBankName,
      newBranchCode: resolvedBranch,
      newAccountType: params.newAccountType,
      requestedBy: params.requestedBy,
      requestedAt: new Date().toISOString(),
      status: 'PENDING_VERIFICATION',
      notes: params.notes,
    };

    this.changeRequests.set(changeRequest.id, changeRequest);

    // Update account status to CHANGE_PENDING so settlements are halted or held until verified
    let updatedAccount: PracticeBankAccount;
    if (currentAccount) {
      updatedAccount = {
        ...currentAccount,
        verificationStatus: 'CHANGE_PENDING',
        updatedAt: new Date().toISOString(),
      };
      this.accounts.set(params.practiceId, updatedAccount);
    } else {
      updatedAccount = this.submitBankOnboarding({
        practiceId: params.practiceId,
        accountHolderName: params.newAccountHolderName,
        businessName: params.practiceId,
        bankName: params.newBankName,
        accountNumber: params.newAccountNumber,
        branchCode: resolvedBranch,
        accountType: params.newAccountType,
        billingEmail: 'practice@digitalnexcare.co.za',
        practiceRegistrationNumber: 'PR-PENDING',
        paymentContactPerson: params.requestedBy,
        userId: params.requestedBy,
      });
    }

    return { changeRequest, updatedAccount };
  }

  /**
   * Admin / Trust Ops Verifies Bank Details Change
   */
  public static verifyBankChangeRequest(
    changeRequestId: string,
    adminUserId: string,
    approved: boolean,
    reason?: string
  ): { success: boolean; account: PracticeBankAccount | null } {
    const request = this.changeRequests.get(changeRequestId);
    if (!request) return { success: false, account: null };

    const account = this.getPracticeBankAccount(request.practiceId);
    if (!account) return { success: false, account: null };

    if (approved) {
      request.status = 'VERIFIED';
      request.verifiedBy = adminUserId;
      request.verifiedAt = new Date().toISOString();

      const updatedAccount: PracticeBankAccount = {
        ...account,
        accountNumberMasked: request.newAccountMasked,
        bankName: request.newBankName,
        branchCode: request.newBranchCode,
        accountType: request.newAccountType,
        verificationStatus: 'VERIFIED',
        lastVerifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.accounts.set(request.practiceId, updatedAccount);
      return { success: true, account: updatedAccount };
    } else {
      request.status = 'REJECTED';
      request.verifiedBy = adminUserId;
      request.verifiedAt = new Date().toISOString();
      request.notes = reason || 'Bank details failed verification';

      const updatedAccount: PracticeBankAccount = {
        ...account,
        verificationStatus: 'FAILED_VERIFICATION',
        verificationFailureReason: reason || 'Bank account verification failed',
        updatedAt: new Date().toISOString(),
      };
      this.accounts.set(request.practiceId, updatedAccount);
      return { success: false, account: updatedAccount };
    }
  }

  /**
   * Admin direct update of bank verification status
   */
  public static setVerificationStatus(
    practiceId: string,
    status: BankVerificationStatus,
    adminId: string,
    reason?: string
  ): PracticeBankAccount | null {
    const account = this.getPracticeBankAccount(practiceId);
    if (!account) return null;

    const updated: PracticeBankAccount = {
      ...account,
      verificationStatus: status,
      verificationFailureReason: status === 'FAILED_VERIFICATION' ? reason : undefined,
      lastVerifiedAt: status === 'VERIFIED' ? new Date().toISOString() : account.lastVerifiedAt,
      updatedAt: new Date().toISOString(),
    };
    this.accounts.set(practiceId, updated);
    return updated;
  }

  /**
   * Get all bank change requests for admin review
   */
  public static getAllChangeRequests(): BankChangeRequest[] {
    return Array.from(this.changeRequests.values());
  }

  /**
   * Get all accounts for admin inspection
   */
  public static getAllBankAccounts(): PracticeBankAccount[] {
    return Array.from(this.accounts.values());
  }
}
