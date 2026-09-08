import React, { useState, useEffect } from 'react';
import {
  PracticeSettlement,
  PracticeBankAccount,
  BankChangeRequest,
  FinancialAuditLogEntry,
} from '../../types/finance';
import { PractitionerFinanceService } from '../../lib/finance/practitioner-finance-service';
import { FinancialMath } from '../../lib/finance/financial-math';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import {
  DollarSign,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileCheck,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

export const AdminFinanceDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [settlements, setSettlements] = useState<PracticeSettlement[]>([]);
  const [bankAccounts, setBankAccounts] = useState<PracticeBankAccount[]>([]);
  const [changeRequests, setChangeRequests] = useState<BankChangeRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<FinancialAuditLogEntry[]>([]);

  // Adjustment Modal state
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjPracticeId, setAdjPracticeId] = useState('prac-001');
  const [adjAmountZAR, setAdjAmountZAR] = useState('150.00');
  const [adjDirection, setAdjDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjReason, setAdjReason] = useState('Goodwill credit adjustment for service interruption');
  const [adjRef, setAdjRef] = useState('REF-ADJ-2026-01');

  const [notification, setNotification] = useState<string | null>(null);

  const loadData = () => {
    setMetrics(PractitionerFinanceService.getAdminFinancialMetrics());
    setSettlements(PractitionerFinanceService.getWeeklySettlements('all'));
    setBankAccounts(PractitionerFinanceService.getAllBankAccounts());
    setChangeRequests(PractitionerFinanceService.getAllBankChangeRequests());
    setAuditLogs(PractitionerFinanceService.getAuditLogs('all'));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkSettlementPaid = (settlementId: string) => {
    const res = PractitionerFinanceService.markSettlementPaid(settlementId);
    if (res.success) {
      setNotification(`Settlement marked as PAID. Reference: ${res.settlement?.gatewaySettlementReference}`);
      loadData();
    } else {
      setNotification(`Error: ${res.error}`);
    }
    setTimeout(() => setNotification(null), 4000);
  };

  const handleVerifyBankChange = (requestId: string, approved: boolean) => {
    const res = PractitionerFinanceService.verifyBankChange(
      requestId,
      'admin_user_001',
      approved,
      approved ? undefined : 'Documentation did not match practice registration'
    );
    if (res.success) {
      setNotification('Bank change request approved and verified.');
    } else {
      setNotification('Bank change request rejected.');
    }
    loadData();
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDirectVerifyAccount = (practiceId: string, status: PracticeBankAccount['verificationStatus']) => {
    PractitionerFinanceService.setBankVerificationStatus(practiceId, status, 'admin_user_001');
    setNotification(`Bank account status set to ${status}.`);
    loadData();
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = FinancialMath.parseZARToCents(adjAmountZAR);

    PractitionerFinanceService.logAuditEvent({
      practiceId: adjPracticeId,
      actorId: 'admin_user_001',
      actorRole: 'FINANCE_BILLING',
      action: 'MANUAL_ADJUSTMENT_CREATED',
      details: {
        direction: adjDirection,
        amountCents,
        reason: adjReason,
        ref: adjRef,
      },
    });

    setNotification(`Adjustment of ${FinancialMath.formatCentsToZAR(amountCents)} (${adjDirection}) created.`);
    setShowAdjModal(false);
    loadData();
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#176BFF]">Platform Finance Ops</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-mono text-slate-500">Super Admin & Finance Billing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              National Marketplace Financial Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Platform 7% revenue, gateway reconciliation, practice bank onboarding audits, and weekly payouts.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
              onClick={() => setShowAdjModal(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Manual Adjustment</span>
            </Button>
            <Button variant="primary" size="sm" onClick={loadData} className="flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Ledger</span>
            </Button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-950 flex items-center justify-between shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-emerald-800">
              Dismiss
            </button>
          </div>
        )}

        {/* Top Platform Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Gross Booking Value */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Gross Marketplace Value</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {FinancialMath.formatCentsToZAR(metrics?.grossBookingValueCents || 0)}
            </div>
            <p className="text-[11px] text-slate-500">
              Across all online consultations in ZAR
            </p>
          </div>

          {/* KPI 2: DigitalNexCare 7% Platform Fee */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>7% Platform Fee Revenue</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#176BFF]">
                Platform Net
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#176BFF]">
              {FinancialMath.formatCentsToZAR(metrics?.platformFeeRevenueCents || 0)}
            </div>
            <p className="text-[11px] text-slate-500">
              Plus Practice Flex: {FinancialMath.formatCentsToZAR(metrics?.practiceFlexRevenueCents || 14900)}
            </p>
          </div>

          {/* KPI 3: Gateway Processing Fees */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Gateway Fees (Paystack)</span>
              <Receipt className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800">
              {FinancialMath.formatCentsToZAR(metrics?.gatewayProcessingFeesCents || 0)}
            </div>
            <p className="text-[11px] text-slate-500">
              Passed through; not part of 7% fee
            </p>
          </div>

          {/* KPI 4: Net Settlement Obligations */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Pending Settlement Payouts</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              {FinancialMath.formatCentsToZAR(metrics?.netSettlementObligationsCents || 0)}
            </div>
            <p className="text-[11px] text-slate-500">
              {metrics?.weeklySettlementsCount || 0} batches recorded ({metrics?.paidSettlementsCount || 0} paid)
            </p>
          </div>
        </div>

        {/* Bank Onboarding Verification Queue */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#176BFF]" />
              <h3 className="font-bold text-slate-900">Practice Bank Account Verification Queue</h3>
            </div>
            <Badge variant="warning" size="sm">
              {metrics?.pendingBankVerifications || 0} Pending
            </Badge>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="p-3 font-semibold">Practice / Business</th>
                  <th className="p-3 font-semibold">Account Holder</th>
                  <th className="p-3 font-semibold">Bank & Branch</th>
                  <th className="p-3 font-semibold">Masked Account</th>
                  <th className="p-3 font-semibold">Reg / Tax</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-center">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bankAccounts.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-900">
                      {b.businessName}
                      <span className="block text-[10px] text-slate-400 font-mono">{b.practiceId}</span>
                    </td>
                    <td className="p-3 text-slate-700">{b.accountHolderName}</td>
                    <td className="p-3 text-slate-700">
                      {b.bankName} ({b.branchCode})
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">{b.accountNumberMasked}</td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">
                      {b.practiceRegistrationNumber}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={b.verificationStatus === 'VERIFIED' ? 'verified' : b.verificationStatus === 'FAILED_VERIFICATION' ? 'error' : 'warning'}
                        size="sm"
                      >
                        {b.verificationStatus}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      {b.verificationStatus !== 'VERIFIED' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-[11px] py-1 px-2.5 h-auto bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleDirectVerifyAccount(b.practiceId, 'VERIFIED')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] py-1 px-2.5 h-auto text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDirectVerifyAccount(b.practiceId, 'FAILED_VERIFICATION')}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-emerald-700 font-medium text-[11px] flex items-center justify-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified Signatory
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weekly Settlement Batches & Payout Authorization */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#176BFF]" />
              <h3 className="font-bold text-slate-900">National Settlement Batches</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Enforcing Idempotent Weekly Batches</span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="p-3 font-semibold">Settlement No.</th>
                  <th className="p-3 font-semibold">Practice ID</th>
                  <th className="p-3 font-semibold">Period</th>
                  <th className="p-3 font-semibold text-right">Gross Total</th>
                  <th className="p-3 font-semibold text-right">7% DNC Fee</th>
                  <th className="p-3 font-semibold text-right">Net Payout</th>
                  <th className="p-3 font-semibold">Payout Destination</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-center">Payout Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-slate-900">{s.settlementNumber}</td>
                    <td className="p-3 font-mono text-slate-600">{s.practiceId}</td>
                    <td className="p-3 text-slate-600">
                      {new Date(s.periodStart).toLocaleDateString('en-ZA')} –{' '}
                      {new Date(s.periodEnd).toLocaleDateString('en-ZA')}
                    </td>
                    <td className="p-3 text-right font-semibold text-slate-900">
                      {FinancialMath.formatCentsToZAR(s.grossAmountCents)}
                    </td>
                    <td className="p-3 text-right text-rose-600 font-bold">
                      {FinancialMath.formatCentsToZAR(s.platformFeeCents)}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-600 text-sm">
                      {FinancialMath.formatCentsToZAR(s.netAmountCents)}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-700">
                      {s.destinationAccountMasked}
                    </td>
                    <td className="p-3">
                      <Badge variant={s.status === 'PAID' ? 'verified' : s.status === 'READY' ? 'primary' : 'warning'} size="sm">
                        {s.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      {s.status === 'READY' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-[11px] py-1 px-2.5 h-auto bg-[#176BFF]"
                          onClick={() => handleMarkSettlementPaid(s.id)}
                        >
                          Execute Payout
                        </Button>
                      ) : s.status === 'PAID' ? (
                        <span className="text-[11px] text-emerald-700 font-bold">
                          Settled ({s.gatewaySettlementReference?.slice(0, 10)})
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-700 font-medium">{s.failureReason || 'Awaiting Cutoff'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Audit Trail */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#176BFF]" />
              <h3 className="font-bold text-slate-900">Immutable Financial Audit Trail</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Compliance & Governance</span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="p-2.5 font-semibold">Timestamp</th>
                  <th className="p-2.5 font-semibold">Actor & Role</th>
                  <th className="p-2.5 font-semibold">Action</th>
                  <th className="p-2.5 font-semibold">Practice</th>
                  <th className="p-2.5 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="p-2.5 text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString('en-ZA')}
                    </td>
                    <td className="p-2.5 text-slate-800 font-sans">
                      {log.actorId} <span className="text-[10px] text-slate-400">({log.actorRole})</span>
                    </td>
                    <td className="p-2.5 font-semibold text-[#176BFF]">{log.action}</td>
                    <td className="p-2.5 text-slate-600">{log.practiceId || 'N/A'}</td>
                    <td className="p-2.5 text-slate-500 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Financial Adjustment Modal */}
      {showAdjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Create Financial Adjustment</h3>
            <p className="text-xs text-slate-500">
              Manually apply a credit or debit to a practice settlement ledger.
            </p>

            <form onSubmit={handleCreateAdjustment} className="space-y-3 text-xs">
              <Input
                label="Practice ID"
                value={adjPracticeId}
                onChange={(e) => setAdjPracticeId(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Amount (ZAR)"
                  value={adjAmountZAR}
                  onChange={(e) => setAdjAmountZAR(e.target.value)}
                  required
                />
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Direction</label>
                  <select
                    value={adjDirection}
                    onChange={(e) => setAdjDirection(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#176BFF]"
                  >
                    <option value="CREDIT">CREDIT (+)</option>
                    <option value="DEBIT">DEBIT (-)</option>
                  </select>
                </div>
              </div>

              <Input
                label="Reason"
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                required
              />
              <Input
                label="Supporting Reference"
                value={adjRef}
                onChange={(e) => setAdjRef(e.target.value)}
                required
              />

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button variant="ghost" type="button" onClick={() => setShowAdjModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Record Adjustment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
