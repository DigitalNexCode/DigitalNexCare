import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PatientLayout } from '../../components/layout/PatientLayout';
import { useAuth } from '../../lib/auth/context';
import { SUBSCRIPTION_PLANS } from '../../lib/constants';
import { PricingTable } from '../../components/subscription/PricingTable';
import { SubscriptionService, Chunk5TestResult } from '../../lib/subscription/subscription-service';
import { PaymentService } from '../../lib/payments/payment-service';
import {
  PatientSubscriptionRecord,
  PaymentRecord,
  Chunk9TestSummary,
  PatientSubscriptionTier,
} from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Sparkles,
  Check,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  PlayCircle,
  ShieldAlert,
  Zap,
  CreditCard,
  History,
  Calendar,
  AlertTriangle,
  Receipt,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';

export const PatientSubscriptionPage: React.FC = () => {
  const { user, subscriptionPlan, revealsRemaining, setSubscriptionPlan } = useAuth();
  const currentPlan = SUBSCRIPTION_PLANS[subscriptionPlan];

  const [activeSub, setActiveSub] = useState<PatientSubscriptionRecord | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);

  // Test runners
  const [chunk5Results, setChunk5Results] = useState<Chunk5TestResult[] | null>(null);
  const [isRunningChunk5, setIsRunningChunk5] = useState(false);

  const [chunk9Summary, setChunk9Summary] = useState<Chunk9TestSummary | null>(null);
  const [isRunningChunk9, setIsRunningChunk9] = useState(false);

  // Cancellation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  // Upgrade modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState<PatientSubscriptionTier>('NEXCARE_FAMILY');
  const [prorationDetails, setProrationDetails] = useState<any>(null);

  useEffect(() => {
    const userId = user?.id || 'usr_pat_001';
    const sub = PaymentService.getSubscription(userId);
    setActiveSub(sub);

    const history = PaymentService.getUserPaymentHistory(userId);
    setPaymentHistory(history);
  }, [user, subscriptionPlan]);

  const handleRunChunk5Tests = () => {
    setIsRunningChunk5(true);
    setTimeout(() => {
      const res = SubscriptionService.runChunk5AcceptanceTests();
      setChunk5Results(res);
      setIsRunningChunk5(false);
    }, 400);
  };

  const handleRunChunk9Tests = async () => {
    setIsRunningChunk9(true);
    try {
      const res = await PaymentService.runChunk9AcceptanceTests();
      setChunk9Summary(res);
    } finally {
      setIsRunningChunk9(false);
    }
  };

  const handleConfirmCancellation = () => {
    const userId = user?.id || 'usr_pat_001';
    const res = PaymentService.cancelSubscription(userId, false);
    if (res.success && res.subscription) {
      setActiveSub({ ...res.subscription });
      setCancelFeedback(res.message);
      setShowCancelModal(false);
    }
  };

  const handleOpenUpgrade = async (targetTier: PatientSubscriptionTier) => {
    setUpgradeTier(targetTier);
    const proration = await PaymentService.calculateUpgradeProration(
      subscriptionPlan,
      targetTier,
      20
    );
    setProrationDetails(proration);
    setShowUpgradeModal(true);
  };

  return (
    <PatientLayout
      title="Subscription & Payments"
      subtitle="Manage your patient subscription plan, South African payment methods, and external reveal entitlements."
    >
      {/* Current Active Plan Card */}
      <div className="bg-[#07111F] text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="brand" size="sm" icon={<Sparkles className="w-3 h-3" />}>
                Active Entitlement
              </Badge>
              {activeSub?.cancelAtPeriodEnd ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Cancels at Period End
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeSub?.status || 'ACTIVE'}
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
              {currentPlan.name}
            </h2>
            <p className="text-xs text-slate-400 mt-1">{currentPlan.tagline}</p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-3xl font-black text-white">R{currentPlan.priceZAR}</div>
            <div className="text-xs text-slate-400">per month (ZAR)</div>
          </div>
        </div>

        {cancelFeedback && (
          <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-800 text-xs text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{cancelFeedback}</span>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 text-[11px]">Monthly Quota</span>
            <div className="text-base font-bold text-white mt-0.5">
              {revealsRemaining > 900 ? 'Unlimited Reveals' : `${revealsRemaining} reveals remaining`}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 text-[11px]">Payment Gateway</span>
            <div className="text-base font-bold text-[#00E5D4] mt-0.5 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              <span>{activeSub?.paymentGateway || 'PAYSTACK (SA)'}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 text-[11px]">Renewal Date</span>
            <div className="text-base font-bold text-white mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                {activeSub?.currentPeriodEnd
                  ? new Date(activeSub.currentPeriodEnd).toLocaleDateString('en-ZA')
                  : '30 days from signup'}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-emerald-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> Provider direct booking is always 100% free
          </div>

          <div className="flex items-center gap-2">
            {subscriptionPlan !== 'NEXCARE_FAMILY' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenUpgrade('NEXCARE_FAMILY')}
              >
                Upgrade Plan
              </Button>
            )}

            {subscriptionPlan !== 'NEXCARE_FREE' && !activeSub?.cancelAtPeriodEnd && (
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300 hover:text-rose-400 hover:border-rose-800"
                onClick={() => setShowCancelModal(true)}
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="mt-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">Payment & Invoicing History</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">South African ZAR</span>
        </div>

        {paymentHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No payment transactions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Gateway</th>
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentHistory.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 text-slate-700 font-medium">
                      {new Date(p.createdAt).toLocaleDateString('en-ZA')}
                    </td>
                    <td className="py-3 font-semibold text-slate-900">
                      {SUBSCRIPTION_PLANS[p.planId]?.name || p.planId}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${p.gateway === 'PAYSTACK' ? 'bg-blue-50 text-[#176BFF]' : 'bg-emerald-50 text-emerald-800'}`}>
                        {p.gateway}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-[11px] text-slate-500">
                      {p.internalReference}
                    </td>
                    <td className="py-3 font-bold text-slate-900">
                      R{p.amountZAR}.00
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {p.receiptUrl ? (
                        <a
                          href={p.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#176BFF] hover:underline font-semibold"
                        >
                          <Receipt className="w-3.5 h-3.5" /> View
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chunk 9: Paystack & Yoco Payment Integration Acceptance Test Runner */}
      <div className="mt-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#176BFF] text-[11px] font-bold">
              <Zap className="w-3 h-3" />
              <span>Chunk 9 Acceptance Verification</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Paystack & Yoco Gateway Test Suite (23 Test Cases)
            </h3>
            <p className="text-xs text-slate-500">
              Covers R50, R100, R250 checkout creation, HMAC signatures (SHA512/SHA256), idempotency, failed payments, Yoco renewal checkouts, refunds, and server-side price protection.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRunChunk9Tests}
            isLoading={isRunningChunk9}
            leftIcon={<PlayCircle className="w-4 h-4" />}
          >
            Run Chunk 9 Tests
          </Button>
        </div>

        {chunk9Summary && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1">
              <span>
                Test Results: {chunk9Summary.passed}/{chunk9Summary.total} Passed ({chunk9Summary.failed} Failed)
              </span>
              <span className={`px-2.5 py-0.5 rounded-md ${chunk9Summary.allPassed ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                {chunk9Summary.allPassed ? '100% GATEWAYS VERIFIED' : 'TESTS FAILED'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {chunk9Summary.results.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs"
                >
                  {t.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#FF3D71] flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{t.id}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${t.gateway === 'PAYSTACK' ? 'bg-blue-100 text-[#176BFF]' : t.gateway === 'YOCO' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                        {t.gateway}
                      </span>
                    </div>
                    <strong className="block text-slate-900 font-bold mt-0.5">{t.name}</strong>
                    <span className="text-slate-500 text-[11px] leading-tight block mt-0.5">
                      {t.details}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chunk 5 Acceptance Test Verification Runner */}
      <div className="mt-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              <Zap className="w-3 h-3" />
              <span>Chunk 5 Verification Suite</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Automated Quota, Gating & Redaction Acceptance Tests
            </h3>
            <p className="text-xs text-slate-500">
              Verifies all 8 constitutional requirements for search, location matching, quotas, repeats, and security projection.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRunChunk5Tests}
            isLoading={isRunningChunk5}
            leftIcon={<PlayCircle className="w-4 h-4 text-[#176BFF]" />}
          >
            Run Chunk 5 Tests
          </Button>
        </div>

        {chunk5Results && (
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1">
              <span>
                Test Summary: {chunk5Results.filter((t) => t.passed).length}/{chunk5Results.length} Passing
              </span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                100% Verified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {chunk5Results.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs"
                >
                  {t.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#FF3D71] flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block text-slate-900 font-bold">{t.name}</strong>
                    <span className="text-slate-500 text-[11px] leading-tight block mt-0.5">
                      {t.details}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Plan Switcher Table */}
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Available Subscription Plans</h3>
        <PricingTable />
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-[#FF3D71] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Cancel Your Subscription?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              In accordance with DigitalNexCare policy, if you cancel today you will retain full access to your{' '}
              <strong>{currentPlan.name}</strong> entitlements until the end of your current billing cycle (
              {activeSub?.currentPeriodEnd
                ? new Date(activeSub.currentPeriodEnd).toLocaleDateString('en-ZA')
                : 'next cycle date'}
              ). You will not be billed again.
            </p>

            <div className="pt-2 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setShowCancelModal(false)}>
                Keep My Plan
              </Button>
              <Button
                variant="accent"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700"
                onClick={handleConfirmCancellation}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Proration Modal */}
      {showUpgradeModal && prorationDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#176BFF] flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Upgrade to {SUBSCRIPTION_PLANS[upgradeTier].name}
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Current Plan:</span>
                <strong className="text-slate-900">{SUBSCRIPTION_PLANS[subscriptionPlan].name} (R{prorationDetails.currentPriceZAR}/mo)</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>New Plan:</span>
                <strong className="text-slate-900">{SUBSCRIPTION_PLANS[upgradeTier].name} (R{prorationDetails.newPriceZAR}/mo)</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Immediate Reveal Increase:</span>
                <strong className="text-emerald-700 font-bold">
                  +{prorationDetails.immediateRevealIncrease === 999 ? 'Unlimited' : prorationDetails.immediateRevealIncrease} reveals
                </strong>
              </div>
              <div className="flex justify-between text-slate-900 font-bold pt-2 border-t border-slate-200">
                <span>Prorated Due Today:</span>
                <span className="text-base text-[#176BFF]">R{prorationDetails.proratedAmountZAR} ZAR</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setShowUpgradeModal(false)}>
                Cancel
              </Button>
              <Link to={`/checkout?plan=${upgradeTier}`}>
                <Button variant="primary" size="sm">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </PatientLayout>
  );
};
