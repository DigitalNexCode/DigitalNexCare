import React, { useState, useEffect } from 'react';
import {
  PracticeBankAccount,
  PracticePaymentSettings,
  PracticeCommercialSubscription,
  PracticeSettlement,
  FinancialStatement,
  PracticeBalanceOverview,
} from '../../types/finance';
import { PractitionerFinanceService } from '../../lib/finance/practitioner-finance-service';
import { FinancialMath } from '../../lib/finance/financial-math';
import { BankOnboardingModal } from '../../components/finance/BankOnboardingModal';
import { CommercialTermsModal } from '../../components/finance/CommercialTermsModal';
import { StatementViewModal } from '../../components/finance/StatementViewModal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  DollarSign,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
  Receipt,
  Settings,
} from 'lucide-react';

export const ProviderFinanceDashboardPage: React.FC = () => {
  const practiceId = 'prac-001';

  // State
  const [bankAccount, setBankAccount] = useState<PracticeBankAccount | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PracticePaymentSettings | null>(null);
  const [practiceFlex, setPracticeFlex] = useState<PracticeCommercialSubscription | null>(null);
  const [settlements, setSettlements] = useState<PracticeSettlement[]>([]);
  const [statements, setStatements] = useState<FinancialStatement[]>([]);
  const [balance, setBalance] = useState<PracticeBalanceOverview | null>(null);

  // Modals
  const [showBankModal, setShowBankModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState<FinancialStatement | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = () => {
    setBankAccount(PractitionerFinanceService.getBankAccount(practiceId));
    setPaymentSettings(PractitionerFinanceService.getPaymentSettings(practiceId));
    setPracticeFlex(PractitionerFinanceService.getPracticeFlex(practiceId));
    setSettlements(PractitionerFinanceService.getWeeklySettlements(practiceId));
    setStatements(PractitionerFinanceService.getPracticeStatements(practiceId));
    setBalance(PractitionerFinanceService.getPracticeBalanceOverview(practiceId));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateWeeklySettlement = () => {
    // Call settlement engine
    const d = new Date();
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diff);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    const s = PractitionerFinanceService.generateWeeklySettlement(
      practiceId,
      mon.toISOString(),
      sun.toISOString()
    );

    if (s) {
      // Also generate matching statement
      PractitionerFinanceService.generateWeeklyStatement(practiceId, mon.toISOString(), sun.toISOString());
      loadData();
      setNotification(`Generated Weekly Settlement ${s.settlementNumber} for ${FinancialMath.formatCentsToZAR(s.netAmountCents)}`);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const getVerificationBadge = (status: PracticeBankAccount['verificationStatus']) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge variant="verified" size="sm">Verified Payout Account</Badge>;
      case 'PENDING_VERIFICATION':
        return <Badge variant="neutral" size="sm">Verification Pending</Badge>;
      case 'CHANGE_PENDING':
        return <Badge variant="warning" size="sm">Bank Change Pending</Badge>;
      case 'FAILED_VERIFICATION':
        return <Badge variant="error" size="sm">Verification Failed</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#176BFF]">Practice Finances</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-mono text-slate-500">ZAR Settlement Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Commercial & Payout Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Real-time balance, transparent 7% fees, Practice Flex subscriptions, and weekly settlement batches.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
              onClick={() => setShowTermsModal(true)}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Commercial Terms</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="flex items-center gap-1.5"
              onClick={handleGenerateWeeklySettlement}
            >
              <CreditCard className="w-4 h-4" />
              <span>Calculate Weekly Settlement</span>
            </Button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-950 flex items-center justify-between shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-emerald-800 hover:text-emerald-950">
              Dismiss
            </button>
          </div>
        )}

        {/* Top Financial Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Estimated Next Settlement */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Next Monday Payout</span>
              <Clock className="w-4 h-4 text-[#176BFF]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {FinancialMath.formatCentsToZAR(balance?.estimatedNextSettlementCents || 0)}
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>Gross this week:</span>
              <strong className="text-slate-700">
                {FinancialMath.formatCentsToZAR(balance?.grossBookingsThisWeekCents || 0)}
              </strong>
            </p>
          </div>

          {/* Card 2: 7% Platform Fee (DigitalNexCare) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Platform Fee (7%)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#176BFF]">
                Fixed 7%
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {FinancialMath.formatCentsToZAR(balance?.platformFeesThisWeekCents || 0)}
            </div>
            <p className="text-[11px] text-slate-500">
              Gateway fees separate ({FinancialMath.formatCentsToZAR(balance?.gatewayFeesThisWeekCents || 0)})
            </p>
          </div>

          {/* Card 3: Practice Flex Subscription */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Practice Flex (In-Person)</span>
              <Badge variant="verified" size="sm">Active</Badge>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              R149<span className="text-xs font-normal text-slate-400">/month</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Monthly Bookings:</span>
                <span className="font-bold text-slate-700">
                  {practiceFlex?.usedBookings || 6} / {practiceFlex?.includedBookings || 10} used
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (((practiceFlex?.usedBookings || 6) / (practiceFlex?.includedBookings || 10)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Last Settlement Dispatched */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Last Settled Batch</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              {FinancialMath.formatCentsToZAR(balance?.lastSettlementCents || 184405)}
            </div>
            <p className="text-[11px] text-slate-500">
              Paid to {bankAccount?.accountNumberMasked || '•••• 4821'} on Monday
            </p>
          </div>
        </div>

        {/* Middle Section: Bank Payout Card + Practice Commercial Plan Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bank Payout Destination Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#176BFF]" />
                <h3 className="font-bold text-slate-900">Payout Bank Account</h3>
              </div>
              {bankAccount && getVerificationBadge(bankAccount.verificationStatus)}
            </div>

            {bankAccount ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Account Holder</span>
                  <span className="font-bold text-slate-900">{bankAccount.accountHolderName}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Bank & Branch:</span>
                  <span className="font-semibold text-slate-800">
                    {bankAccount.bankName} ({bankAccount.branchCode})
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Masked Account:</span>
                  <span className="font-mono font-bold text-slate-900">{bankAccount.accountNumberMasked}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Type:</span>
                  <span className="font-medium text-slate-700">{bankAccount.accountType.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Subaccount Gateway:</span>
                  <span className="font-mono text-[10px] text-slate-500">{bankAccount.gatewaySubaccountCode || 'ACCT_8z9x21p9q8'}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <p className="font-bold">No Bank Account Configured</p>
                <p className="text-[11px]">Add your verified practice banking details to receive automatic weekly settlements.</p>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full text-xs"
              onClick={() => setShowBankModal(true)}
            >
              {bankAccount ? 'Update Bank Account Details' : 'Onboard Bank Account'}
            </Button>
          </div>

          {/* Practice Commercial Rules & Settings */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-900">Commercial Configuration & Rates</h3>
              </div>
              <Badge variant="verified" size="sm">Terms v{paymentSettings?.termsVersion || '2026.1'}</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Pay Online via DigitalNexCare</span>
                  <span className="text-[#176BFF]">7.00% fee</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Direct online prepayment at booking. The 7% fee covers marketplace discovery, scheduling, and infrastructure.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-700 font-semibold text-[11px]">Enabled & Accepting Prepayments</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Pay at Practice (Practice Flex)</span>
                  <span className="text-emerald-700">R149/mo</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Patients pay at your reception. Includes 10 free qualifying completed bookings per month, then R25.00 each overage.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-700 font-semibold text-[11px]">Active • Next renewal 1st of month</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#176BFF]" />
                <span>Practice profile, verification, calendar, and public listing remain <strong>100% Free</strong>.</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#176BFF]"
                onClick={() => setShowTermsModal(true)}
              >
                Review Agreement
              </Button>
            </div>
          </div>
        </div>

        {/* Weekly Settlements Batches */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#176BFF]" />
              <h3 className="font-bold text-slate-900">Weekly Settlement Batches</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Cutoff: Sunday 23:59:59 SAST</span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="p-3 font-semibold">Settlement No.</th>
                  <th className="p-3 font-semibold">Period</th>
                  <th className="p-3 font-semibold">Bookings</th>
                  <th className="p-3 font-semibold text-right">Gross Total</th>
                  <th className="p-3 font-semibold text-right">7% Fee</th>
                  <th className="p-3 font-semibold text-right">Gateway Fee</th>
                  <th className="p-3 font-semibold text-right">Net Payout</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-slate-900">{s.settlementNumber}</td>
                    <td className="p-3 text-slate-600">
                      {new Date(s.periodStart).toLocaleDateString('en-ZA')} –{' '}
                      {new Date(s.periodEnd).toLocaleDateString('en-ZA')}
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{s.itemCount} bookings</td>
                    <td className="p-3 text-right font-semibold text-slate-900">
                      {FinancialMath.formatCentsToZAR(s.grossAmountCents)}
                    </td>
                    <td className="p-3 text-right text-rose-600">
                      -{FinancialMath.formatCentsToZAR(s.platformFeeCents)}
                    </td>
                    <td className="p-3 text-right text-slate-600">
                      -{FinancialMath.formatCentsToZAR(s.gatewayFeeCents)}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-600 text-sm">
                      {FinancialMath.formatCentsToZAR(s.netAmountCents)}
                    </td>
                    <td className="p-3">
                      <Badge variant={s.status === 'PAID' ? 'verified' : s.status === 'READY' ? 'primary' : 'warning'} size="sm">
                        {s.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[11px] py-1 px-2.5 h-auto"
                        onClick={() => {
                          const stm = statements.find((st) => st.id === s.id) || {
                            id: s.id,
                            statementNumber: s.settlementNumber,
                            statementType: 'WEEKLY_SETTLEMENT' as const,
                            practiceId: s.practiceId,
                            practiceName: bankAccount?.businessName || 'Practice',
                            periodStart: s.periodStart,
                            periodEnd: s.periodEnd,
                            grossPaidBookingsCents: s.grossAmountCents,
                            platformFeesCents: s.platformFeeCents,
                            gatewayFeesCents: s.gatewayFeeCents,
                            practiceFlexSubscriptionCents: 0,
                            practiceFlexOverageCents: 0,
                            totalCompletedPayAtPracticeBookings: 0,
                            refundsCents: s.refundAmountCents,
                            adjustmentsCents: s.adjustmentAmountCents,
                            netSettlementOrDueCents: s.netAmountCents,
                            currency: 'ZAR' as const,
                            status: 'SETTLED' as const,
                            destinationAccountMasked: s.destinationAccountMasked,
                            generatedAt: s.calculatedAt,
                            items: [],
                          };
                          setSelectedStatement(stm);
                        }}
                      >
                        View Statement
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Statements Directory */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-700" />
              <h3 className="font-bold text-slate-900">Official Financial Statements & Invoices</h3>
            </div>
            <span className="text-xs text-slate-500">Tax Compliant Invoices</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statements.map((stm) => (
              <div
                key={stm.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-[#176BFF] transition cursor-pointer bg-slate-50/50 hover:bg-white"
                onClick={() => setSelectedStatement(stm)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-slate-500">{stm.statementNumber}</span>
                  <Badge variant={stm.status === 'SETTLED' ? 'verified' : 'primary'} size="sm">
                    {stm.status}
                  </Badge>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {stm.statementType === 'WEEKLY_SETTLEMENT' ? 'Weekly Settlement' : 'Monthly Statement'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(stm.periodStart).toLocaleDateString('en-ZA')} –{' '}
                  {new Date(stm.periodEnd).toLocaleDateString('en-ZA')}
                </p>
                <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Net Amount:</span>
                  <span className="font-black text-slate-900">
                    {FinancialMath.formatCentsToZAR(stm.netSettlementOrDueCents)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showBankModal && (
        <BankOnboardingModal
          practiceId={practiceId}
          currentAccount={bankAccount}
          onClose={() => setShowBankModal(false)}
          onSaved={(acc) => {
            setBankAccount(acc);
            loadData();
          }}
        />
      )}

      {showTermsModal && (
        <CommercialTermsModal
          practiceId={practiceId}
          onClose={() => setShowTermsModal(false)}
          onAccepted={() => {
            loadData();
          }}
        />
      )}

      {selectedStatement && (
        <StatementViewModal
          statement={selectedStatement}
          onClose={() => setSelectedStatement(null)}
        />
      )}
    </div>
  );
};
