import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { SUBSCRIPTION_PLANS } from '../../lib/constants';
import { PatientSubscriptionTier, PaymentGatewayProvider } from '../../types';
import { useAuth } from '../../lib/auth/context';
import { supabase } from '../../lib/supabase/client';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  CreditCard,
  ShieldCheck,
  Check,
  Lock,
  ArrowLeft,
  Zap,
  Building2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export const SubscriptionCheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, setSubscriptionPlan } = useAuth();

  const initialPlanId = (searchParams.get('plan') as PatientSubscriptionTier) || 'NEXCARE_PLUS';
  const [selectedPlan, setSelectedPlan] = useState<PatientSubscriptionTier>(initialPlanId);
  const [paymentGateway, setPaymentGateway] = useState<PaymentGatewayProvider>('PAYSTACK');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Simulated gateway modal state for local preview & sandbox testing
  const [activeReference, setActiveReference] = useState<string | null>(null);

  const plan = SUBSCRIPTION_PLANS[selectedPlan] || SUBSCRIPTION_PLANS.NEXCARE_PLUS;

  const handleInitiateCheckout = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    if (!user) {
      setIsProcessing(false);
      setErrorMessage('Please sign in before starting a subscription checkout.');
      return;
    }

    try {
      if (plan.priceZAR === 0) {
        throw new Error('The free plan does not require checkout. Return to pricing to continue.');
      }
      if (paymentGateway !== 'PAYSTACK') throw new Error('Only Paystack checkout is connected to the live payment flow.');
      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
        body: { planId: selectedPlan },
      });
      if (error || !data?.authorization_url) throw new Error(data?.error || error?.message || 'Failed to initialize Paystack checkout');
      setActiveReference(data.reference);
      window.location.assign(data.authorization_url);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Payment initialization encountered an unexpected error.');
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pricing
        </Link>

        {isSuccess ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">
              Subscription Successfully Activated!
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              You are now on the <strong>{plan.name}</strong> plan with{' '}
              <strong>
                {plan.monthlyReveals === -1 ? 'unlimited' : plan.monthlyReveals} monthly external practitioner reveals
              </strong>
              .
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 max-w-sm mx-auto text-left space-y-1">
              <div>Payment Reference: <strong className="text-slate-900">{activeReference || 'DNX_PSTK_VERIFIED'}</strong></div>
              <div>Gateway: <strong className="text-slate-900">{paymentGateway} (South Africa)</strong></div>
              <div>Status: <strong className="text-emerald-700">ACTIVE</strong></div>
            </div>
            <div className="pt-4 flex justify-center gap-3">
              <Link to="/find-care">
                <Button variant="primary">Search & Unlock Care</Button>
              </Link>
              <Link to="/patient/subscription">
                <Button variant="outline">View My Subscription</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <Badge variant="brand" size="sm">
                Secure Patient Checkout
              </Badge>
              <h1 className="text-2xl font-black text-slate-900 mt-2">
                Upgrade to {plan.name}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Billed monthly. Cancel anytime from your account settings with access continuing until billing period end.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#FF3D71] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Payment Error</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Plan Selector */}
            <div className="grid grid-cols-3 gap-3">
              {(['NEXCARE_ACCESS', 'NEXCARE_PLUS', 'NEXCARE_FAMILY'] as PatientSubscriptionTier[]).map(
                (pKey) => {
                  const p = SUBSCRIPTION_PLANS[pKey];
                  return (
                    <button
                      key={pKey}
                      type="button"
                      onClick={() => setSelectedPlan(pKey)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        selectedPlan === pKey
                          ? 'border-[#176BFF] bg-blue-50/60 ring-2 ring-[#176BFF]/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{p.name}</div>
                      <div className="text-lg font-black text-slate-900 mt-1">R{p.priceZAR}</div>
                      <div className="text-[10px] text-slate-500">
                        {p.monthlyReveals === -1 ? 'Unlimited' : `${p.monthlyReveals} reveals/mo`}
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            {/* Payment Gateway Toggle: Paystack & Yoco (Dual South African support) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Select South African Payment Gateway
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentGateway('PAYSTACK')}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    paymentGateway === 'PAYSTACK'
                      ? 'border-[#176BFF] bg-blue-50/50 ring-2 ring-[#176BFF]/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Paystack (SA)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-[#176BFF] font-semibold">ZAR</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Card, Instant EFT, SnapScan</div>
                  </div>
                  <CreditCard className="w-5 h-5 text-[#176BFF]" />
                </button>

                <button
                  type="button"
                  disabled
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-left flex items-center justify-between opacity-60 cursor-not-allowed"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Yoco Payments (not connected)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">ZAR</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Paystack is currently the active gateway</div>
                  </div>
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                </button>
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Plan:</span>
                <span className="font-semibold text-slate-900">{plan.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Monthly Reveals:</span>
                <span className="font-semibold text-slate-900">
                  {plan.monthlyReveals === -1 ? 'Unlimited' : `${plan.monthlyReveals} external reveals`}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Billing Cycle:</span>
                <span className="font-semibold text-slate-900">
                  {paymentGateway === 'PAYSTACK' ? 'Monthly access (renewal payment)' : 'Monthly billing'}
                </span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold pt-2 border-t border-slate-200 text-sm">
                <span>Total Due Today:</span>
                <span className="text-base text-[#176BFF]">R{plan.priceZAR.toFixed(2)} ZAR</span>
              </div>
            </div>

            <Button
              variant="accent"
              size="lg"
              className="w-full"
              isLoading={isProcessing}
              onClick={handleInitiateCheckout}
              leftIcon={<Lock className="w-4 h-4" />}
            >
              Pay R{plan.priceZAR.toFixed(2)} via {paymentGateway}
            </Button>

            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit SSL Encryption
              </span>
              <span>•</span>
              <span>No raw card details stored</span>
              <span>•</span>
              <span>South African ZAR</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
