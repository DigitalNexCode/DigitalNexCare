import React from 'react';
import { Link } from 'react-router-dom';
import { SUBSCRIPTION_PLANS } from '../../lib/constants';
import { useAuth } from '../../lib/auth/context';
import { PatientSubscriptionTier } from '../../types';
import { Check, ShieldCheck, Sparkles, Info, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface PricingTableProps {
  onSelectPlan?: (tier: PatientSubscriptionTier) => void;
}

export const PricingTable: React.FC<PricingTableProps> = ({ onSelectPlan }) => {
  const { subscriptionPlan, setSubscriptionPlan } = useAuth();

  const handleChoose = (tier: PatientSubscriptionTier) => {
    if (onSelectPlan) {
      onSelectPlan(tier);
    } else {
      setSubscriptionPlan(tier);
    }
  };

  return (
    <div className="py-8">
      {/* Important Public Disclaimer Banner */}
      <div className="mb-10 max-w-4xl mx-auto p-4 sm:p-5 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-3.5 shadow-xs">
        <Info className="w-5 h-5 text-[#176BFF] flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          <strong className="text-slate-900 font-bold block mb-0.5">
            Always Free Provider Booking Guarantee:
          </strong>
          Searching, discovering, and directly booking verified joined{' '}
          <span className="font-bold text-[#176BFF]">DigitalNexCare Providers</span> is{' '}
          <strong>100% Free</strong> for all South Africans and does not require a paid plan.
          Subscription plans exclusively govern contact reveal quotas for external directory practitioners.
        </div>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {Object.values(SUBSCRIPTION_PLANS).map((plan) => {
          const isCurrent = subscriptionPlan === plan.id;
          const isPopular = plan.isPopular;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-200 ${
                isPopular
                  ? 'bg-[#07111F] text-white border-2 border-[#00E5D4] shadow-xl md:-translate-y-2'
                  : 'bg-white text-slate-900 border border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#00E5D4] text-slate-950 font-extrabold text-[11px] px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-slate-950" /> Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className={`text-xl font-extrabold ${
                      isPopular ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {plan.name}
                  </h3>
                </div>

                <p
                  className={`text-xs min-h-[32px] leading-relaxed ${
                    isPopular ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {plan.tagline}
                </p>

                {/* Price Display */}
                <div className="mt-5 pb-5 border-b border-slate-100/20">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-black ${
                        isPopular ? 'text-white' : 'text-slate-950'
                      }`}
                    >
                      R{plan.priceZAR}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        isPopular ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {plan.priceZAR === 0 ? 'free forever' : '/month'}
                    </span>
                  </div>

                  {/* Quota Highlight */}
                  <div className="mt-3">
                    <span
                      className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg ${
                        isPopular
                          ? 'bg-[#00E5D4]/20 text-[#00E5D4] border border-[#00E5D4]/30'
                          : 'bg-blue-50 text-[#176BFF] border border-blue-100'
                      }`}
                    >
                      {plan.monthlyReveals === -1
                        ? 'Unlimited External Reveals'
                        : `${plan.monthlyReveals} External Reveals / mo`}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="mt-5 space-y-3 text-xs">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <div
                        className={`flex-shrink-0 rounded-full p-0.5 mt-0.5 ${
                          isPopular
                            ? 'bg-[#00E5D4]/20 text-[#00E5D4]'
                            : 'bg-blue-50 text-[#176BFF]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span
                        className={`leading-relaxed ${
                          isPopular ? 'text-slate-200' : 'text-slate-600'
                        }`}
                      >
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4">
                <Link to={plan.priceZAR === 0 ? '/find-care' : `/subscription/checkout?plan=${plan.id}`}>
                  <Button
                    variant={isPopular ? 'accent' : isCurrent ? 'outline' : 'primary'}
                    className="w-full"
                    onClick={() => handleChoose(plan.id)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isCurrent ? 'Current Active Plan' : plan.ctaText}
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
