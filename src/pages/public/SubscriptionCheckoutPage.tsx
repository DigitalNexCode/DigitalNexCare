import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { SUBSCRIPTION_PLANS } from '../../lib/constants';
import { PatientSubscriptionTier, PaymentGatewayProvider } from '../../types';
import { useAuth } from '../../lib/auth/context';
import { PaymentService } from '../../lib/payments/payment-service';
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
  const [showSimulatedGatewayModal, setShowSimulatedGatewayModal] = useState(false);
  const [activeReference, setActiveReference] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const plan = SUBSCRIPTION_PLANS[selectedPlan] || SUBSCRIPTION_PLANS.NEXCARE_PLUS;

  const handleInitiateCheckout = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Resolve Server-Side Price & Initialize Gateway Checkout
      const checkoutRes = await PaymentService.createCheckoutSession({
        planId: selectedPlan,
        userId: user?.id || 'usr_current_patient',
        userEmail: user?.email || 'patient@digitalnexcare.co.za',
        userName: user?.fullName || 'Patient User',
        gateway: paymentGateway,
        callbackUrl: window.location.href,
      });

      if (!checkoutRes.success) {
        throw new Error(checkoutRes.error || 'Failed to initialize payment session');
      }

      setActiveReference(checkoutRes.paymentReference);
      setCheckoutUrl(checkoutRes.checkoutUrl);

      if (plan.priceZAR === 0) {
        // Free tier instant activation
        setSubscriptionPlan('NEXCARE_FREE');
        setIsProcessing(false);
        setIsSuccess(true);
        return;
      }

      // Show the official South African payment dialog simulation
      setShowSimulatedGatewayModal(true);
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Payment initialization encountered an unexpected error.');
    }
  };

  const handleCompleteGatewayPayment = async (status: 'SUCCESS' | 'FAILED') => {
    if (!activeReference) return;
    setIsProcessing(true);
    setShowSimulatedGatewayModal(false);

    try {
      if (status === 'FAILED') {
        throw new Error('Payment was declined or cancelled by the card issuer.');
      }

      // Verify and atomically activate subscription
      const activationRes = await PaymentService.verifyAndActivateSubscription(
        activeReference,
        paymentGateway
      );

      if (!activationRes.success) {
        throw new Error(activationRes.error || 'Payment verification failed at gateway');
      }

      // Update auth context state
      setSubscriptionPlan(selectedPlan);
      setIsProcessing(false);
      setIsSuccess(true);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Payment confirmation failed');
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
                  onClick={() => setPaymentGateway('YOCO')}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    paymentGateway === 'YOCO'
                      ? 'border-[#176BFF] bg-blue-50/50 ring-2 ring-[#176BFF]/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Yoco Payments</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">ZAR</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Debit / Credit Card</div>
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
                  {paymentGateway === 'PAYSTACK' ? 'Monthly Auto-Renewal' : 'Monthly Renewal Invoicing'}
                </span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold pt-2 border-t border-slate-200 text-sm">
                <span>Total Due Today:</span>
                <span className="text-base text-[#176BFF]">R{plan.priceZAR}.00 ZAR</span>
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
              Pay R{plan.priceZAR} via {paymentGateway}
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

        {/* Gateway Hosted Simulation Modal */}
        {showSimulatedGatewayModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs ${paymentGateway === 'PAYSTACK' ? 'bg-[#176BFF]' : 'bg-emerald-600'}`}>
                    {paymentGateway === 'PAYSTACK' ? 'PS' : 'YC'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{paymentGateway} South Africa</h3>
                    <p className="text-[11px] text-slate-500">Secure Payment Gateway</p>
                  </div>
                </div>
                <Badge variant="neutral" size="sm">
                  R{plan.priceZAR}.00 ZAR
                </Badge>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Merchant:</span>
                  <strong className="text-slate-900">DigitalNexCare (Pty) Ltd</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Reference:</span>
                  <span className="font-mono text-[11px] text-slate-700">{activeReference}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Customer:</span>
                  <span className="text-slate-900">{user?.email || 'patient@digitalnexcare.co.za'}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleCompleteGatewayPayment('SUCCESS')}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Authorize & Pay R{plan.priceZAR}.00
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-slate-600 hover:text-rose-600 hover:border-rose-200"
                  onClick={() => handleCompleteGatewayPayment('FAILED')}
                >
                  Simulate Bank Decline / Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
