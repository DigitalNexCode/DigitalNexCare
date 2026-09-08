import React, { useState } from 'react';
import { PracticeBankAccount, BankAccountType } from '../../types/finance';
import { PractitionerFinanceService } from '../../lib/finance/practitioner-finance-service';
import { SUPPORTED_SA_BANKS, STANDARD_SA_BRANCH_CODES } from '../../lib/finance/finance-constants';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { X, Building2, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BankOnboardingModalProps {
  practiceId: string;
  currentAccount: PracticeBankAccount | null;
  onClose: () => void;
  onSaved: (account: PracticeBankAccount) => void;
}

export const BankOnboardingModal: React.FC<BankOnboardingModalProps> = ({
  practiceId,
  currentAccount,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(currentAccount);

  const [accountHolderName, setAccountHolderName] = useState(
    currentAccount?.accountHolderName || 'Mediclinic Hatfield Practice Inc'
  );
  const [businessName, setBusinessName] = useState(
    currentAccount?.businessName || 'Mediclinic Hatfield Practice'
  );
  const [bankName, setBankName] = useState(currentAccount?.bankName || 'First National Bank (FNB)');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchCode, setBranchCode] = useState(
    currentAccount?.branchCode || STANDARD_SA_BRANCH_CODES['First National Bank (FNB)'] || '250655'
  );
  const [accountType, setAccountType] = useState<BankAccountType>(
    currentAccount?.accountType || 'CHEQUE_CURRENT'
  );
  const [billingEmail, setBillingEmail] = useState(
    currentAccount?.billingEmail || 'billing@hatfieldpractice.co.za'
  );
  const [practiceRegistrationNumber, setPracticeRegistrationNumber] = useState(
    currentAccount?.practiceRegistrationNumber || 'PR-0941829'
  );
  const [taxVatNumber, setTaxVatNumber] = useState(currentAccount?.taxVatNumber || '4820194821');
  const [paymentContactPerson, setPaymentContactPerson] = useState(
    currentAccount?.paymentContactPerson || 'Dr. Naledi Mokoena'
  );
  const [confirmedAuth, setConfirmedAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBankChange = (selectedBank: string) => {
    setBankName(selectedBank);
    if (STANDARD_SA_BRANCH_CODES[selectedBank]) {
      setBranchCode(STANDARD_SA_BRANCH_CODES[selectedBank]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accountNumber || accountNumber.trim().length < 6) {
      setError('Please enter a valid South African bank account number.');
      return;
    }

    if (!confirmedAuth) {
      setError('You must confirm authority over this bank account to proceed.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      try {
        let savedAccount: PracticeBankAccount;

        if (isEditing) {
          const res = PractitionerFinanceService.requestBankDetailsChange({
            practiceId,
            newAccountHolderName: accountHolderName,
            newBankName: bankName,
            newAccountNumber: accountNumber,
            newBranchCode: branchCode,
            newAccountType: accountType,
            requestedBy: paymentContactPerson,
            notes: 'Provider updated payout banking details via dashboard.',
          });
          savedAccount = res.updatedAccount;
        } else {
          savedAccount = PractitionerFinanceService.submitBankOnboarding({
            practiceId,
            accountHolderName,
            businessName,
            bankName,
            accountNumber,
            branchCode,
            accountType,
            billingEmail,
            practiceRegistrationNumber,
            taxVatNumber,
            paymentContactPerson,
            userId: 'dr_mokoena_001',
          });
        }

        setIsSubmitting(false);
        onSaved(savedAccount);
        onClose();
      } catch (err: any) {
        setIsSubmitting(false);
        setError(err.message || 'Failed to save bank account details.');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative animate-in zoom-in-95 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#176BFF] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Update Payout Bank Details' : 'Bank Onboarding & Settlement Destination'}
              </h3>
              <p className="text-xs text-slate-500">
                Weekly DigitalNexCare settlements will be deposited into this verified account.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isEditing && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Security Protection Notice</p>
              <p className="text-[11px] leading-relaxed">
                To prevent unauthorized payout redirection, changing bank details places the account into{' '}
                <strong>CHANGE PENDING</strong> status until identity and account verification completes.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Account Holder / Entity Name"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              required
            />
            <Input
              label="Practice Trading Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Bank Name"
              value={bankName}
              onChange={(e) => handleBankChange(e.target.value)}
              options={SUPPORTED_SA_BANKS.map((b) => ({ value: b, label: b }))}
            />
            <Input
              label="Branch Code"
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input
                label={isEditing ? 'New Bank Account Number' : 'Bank Account Number'}
                type="password"
                placeholder="Enter 9-11 digit account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Account numbers are masked and stored with PCI/financial level security.
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Account Type</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as BankAccountType)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#176BFF]"
              >
                <option value="CHEQUE_CURRENT">Cheque / Current Account</option>
                <option value="SAVINGS">Savings Account</option>
                <option value="TRANSMISSION">Transmission Account</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Billing / Finance Email"
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              required
            />
            <Input
              label="Practice Reg. Number"
              value={practiceRegistrationNumber}
              onChange={(e) => setPracticeRegistrationNumber(e.target.value)}
              required
            />
            <Input
              label="VAT Number (Optional)"
              value={taxVatNumber}
              onChange={(e) => setTaxVatNumber(e.target.value)}
            />
          </div>

          <Input
            label="Finance Contact Person"
            value={paymentContactPerson}
            onChange={(e) => setPaymentContactPerson(e.target.value)}
            required
          />

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmedAuth}
                onChange={(e) => setConfirmedAuth(e.target.checked)}
                className="mt-0.5 rounded text-[#176BFF] focus:ring-[#176BFF]"
              />
              <span className="text-[11px] leading-tight">
                I hereby declare that I am an authorized signatory for this healthcare practice and that the bank
                details provided are accurate and designated for DigitalNexCare weekly settlements.
              </span>
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Submit Bank Change Request' : 'Save & Verify Bank Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
