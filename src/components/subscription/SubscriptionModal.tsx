import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/context';
import { PatientSubscriptionTier } from '../../types';
import { SUBSCRIPTION_PLANS } from '../../lib/constants';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  X,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Star,
} from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess?: (newPlan: PatientSubscriptionTier) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onUpgradeSuccess,
}) => {
  const { subscriptionPlan, setSubscriptionPlan } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PatientSubscriptionTier>('NEXCARE_PLUS');
  const [isProcessing, setIsProcessing] = useState(false);
  const [upgradeComplete, setUpgradeComplete] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setSubscriptionPlan(selectedPlan);
      setIsProcessing(false);
      setUpgradeComplete(true);
      if (onUpgradeSuccess) {
        onUpgradeSuccess(selectedPlan);
      }
      setTimeout(() => {
        setUpgradeComplete(false);
        onClose();
      }, 1400);
    }, 600);
  };

  const plans = [
    {
      id: 'NEXCARE_ACCESS' as PatientSubscriptionTier,
      name: 'NexCare Access',
      price: 'R50',
      period: '/month',
      reveals: '5 practitioner reveals',
      tagline: 'Ideal for individuals managing occasional specialist care',
      badge: null,
      highlight: false,
    },
    {
      id: 'NEXCARE_PLUS' as PatientSubscriptionTier,
      name: 'NexCare Plus',
      price: 'R100',
      period: '/month',
      reveals: '20 practitioner reveals',
      tagline: 'Advanced discovery & radius matching across South Africa',
      badge: 'MOST POPULAR',
      highlight: true,
    },
    {
      id: 'NEXCARE_FAMILY' as PatientSubscriptionTier,
      name: 'NexCare Family',
      price: 'R250',
      period: '/month',
      reveals: 'Reasonable-use unlimited practitioner access',
      tagline: 'Full household & dependant medical practitioner coverage',
      badge: 'BEST FOR FAMILIES',
      highlight: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#07111F]/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden">
        {/* Top Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#176BFF] to-[#00E5D4]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {upgradeComplete ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Subscription Successfully Activated!
            </h3>
            <p className="text-sm text-slate-600">
              You are now subscribed to{' '}
              <strong className="text-[#176BFF]">
                {SUBSCRIPTION_PLANS[selectedPlan].name}
              </strong>
              . Your external practitioner reveals have been updated.
            </p>
          </div>
        ) : (
          <div>
            {/* Header / Constitutional Headline & Text */}
            <div className="text-center max-w-lg mx-auto space-y-2 mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-bold">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Practitioner Access Limit Reached</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                You've reached your free practitioner access limit.
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your free account includes access to 2 external practitioners per month. Upgrade to continue viewing practitioner names and contact details.
              </p>
            </div>

            {/* Plans List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-200 border flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#176BFF] bg-blue-50/50 ring-2 ring-[#176BFF]/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#176BFF] text-[10px] font-extrabold text-white tracking-wider uppercase shadow-xs flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-white" />
                        <span>{plan.badge}</span>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        {plan.name}
                      </h4>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-xl font-extrabold text-slate-900">
                          {plan.price}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          {plan.period}
                        </span>
                      </div>

                      <div className="mt-2.5 p-2 rounded-xl bg-white border border-slate-100 text-xs font-bold text-slate-800 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#176BFF] flex-shrink-0 mt-0.5" />
                        <span className="leading-snug">{plan.reveals}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-2.5 leading-tight">
                      {plan.tagline}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Free Provider Reminder Banner */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-6 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>Reminder:</strong> Direct booking of joined DigitalNexCare Providers is always <strong>100% free</strong> without any subscription.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Keep Free Plan
              </button>

              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto font-bold px-6"
                isLoading={isProcessing}
                onClick={handleUpgrade}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Upgrade to {SUBSCRIPTION_PLANS[selectedPlan].name}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
