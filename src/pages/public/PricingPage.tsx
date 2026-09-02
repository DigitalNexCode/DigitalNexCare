import React from 'react';
import { PricingTable } from '../../components/subscription/PricingTable';
import { Badge } from '../../components/ui/Badge';
import { HelpCircle, ShieldCheck, Check, Sparkles } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const faqs = [
    {
      q: 'Is finding and booking appointments on DigitalNexCare really free?',
      a: 'Yes, 100% free! You never pay any subscription or booking fee to search for, discover, and book appointments with verified DigitalNexCare Providers who have joined our scheduling system.',
    },
    {
      q: 'Why do you offer subscription plans?',
      a: 'DigitalNexCare maintains a vast national index of licensed external healthcare practitioners sourced from public registers and professional bodies. Subscriptions allow users to unlock full direct contact details (telephone, physical address, email, directions) beyond the 2 free monthly reveals included in the Freemium plan.',
    },
    {
      q: 'Do unrevealed external practitioners show fake appointment times?',
      a: 'Never. DigitalNexCare strictly prohibits simulated calendars or fake booking times for external practitioners. We only display real live appointment slots for verified providers who manage their schedule through DigitalNexCare.',
    },
    {
      q: 'Can I cancel or change my patient subscription at any time?',
      a: 'Yes, you can upgrade, downgrade, or cancel your monthly subscription at any moment from your Patient Portal without penalties.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="brand" size="sm" icon={<Sparkles className="w-3.5 h-3.5" />}>
            Transparent South African Pricing
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mt-3 tracking-tight">
            Plans for Every Individual and Household
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-3 leading-relaxed">
            Free appointment booking on verified providers. Affordable monthly allowances for unlocking direct contact with external directory practices.
          </p>
        </div>

        {/* Pricing Cards */}
        <PricingTable />

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto pt-8 border-t border-slate-200">
          <h2 className="text-2xl font-black text-slate-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-[#176BFF] flex-shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
