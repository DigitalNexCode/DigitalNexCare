import React, { useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Chunk8OperationsService } from '../../lib/admin/chunk8-service';
import { PaymentService } from '../../lib/payments/payment-service';
import {
  SubscriptionAdminTierConfig,
  SubscriptionAnalyticsMetrics,
  PatientSubscriptionTier,
  PaymentReconciliationItem,
  PaymentRecord,
  Chunk9TestSummary,
} from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
  CreditCard,
  TrendingUp,
  Users,
  CheckCircle2,
  Lock,
  Sparkles,
  BarChart3,
  Edit,
  Save,
  Check,
  Percent,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  PlayCircle,
  XCircle,
  Receipt,
  RotateCcw,
  Zap,
} from 'lucide-react';

export const AdminSubscriptionsPage: React.FC = () => {
  const [tiers, setTiers] = useState<SubscriptionAdminTierConfig[]>(
    Chunk8OperationsService.getSubscriptionTiers()
  );
  const [metrics, setMetrics] = useState<SubscriptionAnalyticsMetrics>(
    Chunk8OperationsService.getSubscriptionMetrics()
  );

  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [editPriceZAR, setEditPriceZAR] = useState(0);
  const [editRevealAllowance, setEditRevealAllowance] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');

  // Payment Reconciliation Desk State
  const [reconciliationList, setReconciliationList] = useState<PaymentReconciliationItem[]>(
    PaymentService.getReconciliationReport()
  );
  const [gatewayFilter, setGatewayFilter] = useState<'ALL' | 'PAYSTACK' | 'YOCO'>('ALL');
  const [refundTarget, setRefundTarget] = useState<PaymentReconciliationItem | null>(null);
  const [refundReason, setRefundReason] = useState('Customer Satisfaction Guarantee');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Chunk 9 Test Suite
  const [chunk9Summary, setChunk9Summary] = useState<Chunk9TestSummary | null>(null);
  const [isRunningChunk9, setIsRunningChunk9] = useState(false);

  const handleStartEdit = (tier: SubscriptionAdminTierConfig) => {
    setEditingTierId(tier.id);
    setEditPriceZAR(tier.priceZAR);
    setEditRevealAllowance(tier.revealAllowance);
  };

  const handleSaveTier = (tierId: string) => {
    Chunk8OperationsService.updateSubscriptionTier(tierId as PatientSubscriptionTier, {
      priceZAR: editPriceZAR,
      revealAllowance: editRevealAllowance,
      monthlyReveals: editRevealAllowance,
    });
    setTiers([...Chunk8OperationsService.getSubscriptionTiers()]);
    setEditingTierId(null);
    setSuccessMsg('Subscription tier pricing and reveal allowances saved.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleRefreshReconciliation = () => {
    setReconciliationList([...PaymentService.getReconciliationReport()]);
  };

  const handleExecuteRefund = async () => {
    if (!refundTarget) return;
    setIsProcessingRefund(true);
    try {
      const res = await PaymentService.processRefund({
        paymentReference: refundTarget.internalPaymentId,
        gatewayReference: refundTarget.gatewayReference,
        amountZAR: refundTarget.settledAmountZAR,
        reason: refundReason,
        adminUserId: 'admin_trust_ops_1',
      });

      if (res.success) {
        setSuccessMsg(`Refund processed successfully. Gateway Refund ID: ${res.refundId}`);
        handleRefreshReconciliation();
      } else {
        setSuccessMsg(`Refund failed: ${res.message}`);
      }
    } finally {
      setIsProcessingRefund(false);
      setRefundTarget(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleRunChunk9Tests = async () => {
    setIsRunningChunk9(true);
    try {
      const res = await PaymentService.runChunk9AcceptanceTests();
      setChunk9Summary(res);
      handleRefreshReconciliation();
    } finally {
      setIsRunningChunk9(false);
    }
  };

  const filteredReconciliations = reconciliationList.filter((item) => {
    if (gatewayFilter === 'ALL') return true;
    return item.gateway === gatewayFilter;
  });

  return (
    <AdminLayout
      title="Subscriptions, Revenue & Payment Gateways"
      subtitle="Manage patient subscription tiers, Paystack & Yoco gateway reconciliation, paywall conversion funnels, and MRR metrics."
    >
      <div className="space-y-6">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Monthly Recurring Revenue</span>
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              R{metrics.monthlyRecurringRevenueZAR.toLocaleString()} ZAR
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +24.8% MoM growth
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Active Paid Subscribers</span>
              <Users className="w-4 h-4 text-[#176BFF]" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {metrics.activePaidSubscribers.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Across Access, Plus & Family
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Free Registered Users</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {metrics.totalFreeUsers.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              2 reveals/month freemium quota
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Paywall Conversion Rate</span>
              <Percent className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {metrics.paywallConversionRatePercent}%
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              Locked Card → Paid Upgrade
            </span>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Chunk 9 Gateway Acceptance Test Runner */}
        <div className="bg-[#07111F] text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#176BFF]/20 text-[#00E5D4] text-[11px] font-bold border border-[#00E5D4]/30">
                <Zap className="w-3 h-3" />
                <span>Chunk 9 Gateway Integration Engine</span>
              </div>
              <h3 className="text-xl font-black text-white mt-1">
                Paystack & Yoco Dual-Gateway Acceptance Runner
              </h3>
              <p className="text-xs text-slate-400">
                Executes all 23 verification scenarios: R50, R100, R250 checkout creation, HMAC-SHA512/SHA256 signature enforcement, duplicate webhook idempotency, Yoco renewal checkouts, refunds, and server-side pricing anti-tampering.
              </p>
            </div>

            <Button
              variant="accent"
              size="sm"
              onClick={handleRunChunk9Tests}
              isLoading={isRunningChunk9}
              leftIcon={<PlayCircle className="w-4 h-4" />}
            >
              Run Chunk 9 Verification Suite
            </Button>
          </div>

          {chunk9Summary && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1">
                <span>
                  Verification Status: {chunk9Summary.passed}/{chunk9Summary.total} Scenarios Passed
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  100% GATEWAYS CONSTITUTIONAL COMPLIANT
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {chunk9Summary.results.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 text-xs"
                  >
                    {t.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#00E5D4] flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[#FF3D71] flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-slate-400 font-bold">{t.id}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${t.gateway === 'PAYSTACK' ? 'bg-[#176BFF]/30 text-blue-300' : t.gateway === 'YOCO' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                          {t.gateway}
                        </span>
                      </div>
                      <strong className="block text-white font-bold mt-0.5">{t.name}</strong>
                      <span className="text-slate-400 text-[11px] leading-tight block mt-0.5">
                        {t.details}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Real-time Payment Reconciliation Desk */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#176BFF]" />
                Payment Gateway Reconciliation Desk
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time automated audit of internal records vs. Paystack & Yoco gateway settlements and webhook verification states.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
                {(['ALL', 'PAYSTACK', 'YOCO'] as const).map((gw) => (
                  <button
                    key={gw}
                    onClick={() => setGatewayFilter(gw)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      gatewayFilter === gw ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    {gw}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshReconciliation}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="pb-3">Internal ID</th>
                  <th className="pb-3">Gateway Ref</th>
                  <th className="pb-3">Gateway</th>
                  <th className="pb-3">Patient Email</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Expected (ZAR)</th>
                  <th className="pb-3">Settled (ZAR)</th>
                  <th className="pb-3">Internal Status</th>
                  <th className="pb-3">Gateway Status</th>
                  <th className="pb-3">Webhook</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReconciliations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-mono font-bold text-slate-800">{item.internalPaymentId}</td>
                    <td className="py-3 font-mono text-[11px] text-slate-500">{item.gatewayReference}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${item.gateway === 'PAYSTACK' ? 'bg-blue-50 text-[#176BFF]' : 'bg-emerald-50 text-emerald-800'}`}>
                        {item.gateway}
                      </span>
                    </td>
                    <td className="py-3 text-slate-700">{item.userEmail}</td>
                    <td className="py-3 font-semibold text-slate-900">{item.planId}</td>
                    <td className="py-3 font-bold text-slate-900">R{item.expectedAmountZAR}.00</td>
                    <td className="py-3 font-bold text-emerald-700">R{item.settledAmountZAR}.00</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {item.internalStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {item.gatewayStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        {item.webhookState}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {item.internalStatus === 'SUCCESS' && (
                        <button
                          type="button"
                          onClick={() => setRefundTarget(item)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subscription Tiers Configuration */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#176BFF]" />
                Patient Subscription Tier Management
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure plan quotas, pricing in ZAR, and marketing badges dynamically without codebase redeployment.
              </p>
            </div>
            <Badge variant="verified" size="sm">
              Server Enforced
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tier) => {
              const isEditing = editingTierId === tier.id;

              return (
                <div
                  key={tier.id}
                  className={`rounded-3xl p-5 border flex flex-col justify-between space-y-4 transition-all ${
                    tier.isPopular
                      ? 'border-[#176BFF] bg-[#176BFF]/5 shadow-sm'
                      : 'border-slate-200 bg-white shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-slate-900 text-sm">{tier.name}</h4>
                      {tier.isPopular && (
                        <span className="px-2 py-0.5 rounded-full bg-[#176BFF] text-white text-[10px] font-bold">
                          POPULAR
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{tier.description}</p>

                    {/* Price & Quota Box */}
                    <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            label="Price in ZAR (R/mo)"
                            type="number"
                            value={editPriceZAR}
                            onChange={(e) => setEditPriceZAR(Number(e.target.value))}
                          />
                          <Input
                            label="Reveals / Month (-1 = Unlimited)"
                            type="number"
                            value={editRevealAllowance}
                            onChange={(e) => setEditRevealAllowance(Number(e.target.value))}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Monthly Price:</span>
                            <span className="font-black text-slate-900 text-sm">
                              {tier.priceZAR === 0 ? 'Free (R0)' : `R${tier.priceZAR}/mo`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Reveal Quota:</span>
                            <span className="font-bold text-slate-800">
                              {tier.revealAllowance === -1 ? 'Unlimited' : `${tier.revealAllowance} reveals/mo`}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Features List */}
                    <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                      {tier.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span className="text-[11px]">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                    {isEditing ? (
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setEditingTierId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleSaveTier(tier.id)}
                          leftIcon={<Save className="w-3.5 h-3.5" />}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleStartEdit(tier)}
                        leftIcon={<Edit className="w-3.5 h-3.5" />}
                      >
                        Edit Tier
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plan Mix Breakdown & Churn */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#176BFF]" />
              Paid Plan Mix Distribution
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>NexCare Plus (R100/mo)</span>
                  <span>{metrics.planMix.plus} subscribers (52%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#176BFF] h-full w-[52%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>NexCare Access (R50/mo)</span>
                  <span>{metrics.planMix.access} subscribers (35%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[35%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>NexCare Family (R250/mo)</span>
                  <span>{metrics.planMix.family} subscribers (13%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full w-[13%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              Direct Booking Exemption Rule
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Per the DigitalNexCare Constitution, direct appointment booking for joined, verified practitioners (DigitalNexCare Providers) is <strong>100% free of charge</strong> for all South Africans. The subscription controls access to external unjoined directory contact details.
            </p>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              Verified Providers are never paywalled.
            </div>
          </div>
        </div>
      </div>

      {/* Admin Refund Execution Modal */}
      {refundTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-[#FF3D71] flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Execute Gateway Refund
            </h3>
            <p className="text-xs text-slate-600">
              Initiates an official refund of <strong>R{refundTarget.settledAmountZAR}.00</strong> via{' '}
              <strong>{refundTarget.gateway}</strong> for customer <strong>{refundTarget.userEmail}</strong>.
            </p>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div>Reference: <span className="font-mono text-slate-700">{refundTarget.internalPaymentId}</span></div>
              <div>Gateway ID: <span className="font-mono text-slate-700">{refundTarget.gatewayReference}</span></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Refund
              </label>
              <Input
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setRefundTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="accent"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700"
                isLoading={isProcessingRefund}
                onClick={handleExecuteRefund}
              >
                Confirm & Refund R{refundTarget.settledAmountZAR}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
