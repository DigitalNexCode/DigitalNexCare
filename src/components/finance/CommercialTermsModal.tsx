import React, { useState } from 'react';
import { PractitionerFinanceService } from '../../lib/finance/practitioner-finance-service';
import { COMMERCIAL_TERMS_VERSION } from '../../lib/finance/finance-constants';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { X, ShieldCheck, Check, DollarSign, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface CommercialTermsModalProps {
  practiceId: string;
  onClose: () => void;
  onAccepted: () => void;
}

export const CommercialTermsModal: React.FC<CommercialTermsModalProps> = ({
  practiceId,
  onClose,
  onAccepted,
}) => {
  const [agreedTo7Percent, setAgreedTo7Percent] = useState(true);
  const [agreedToGatewayPolicy, setAgreedToGatewayPolicy] = useState(true);
  const [agreedToSettlements, setAgreedToSettlements] = useState(true);
  const [enableOnline, setEnableOnline] = useState(true);
  const [enablePracticeFlex, setEnablePracticeFlex] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canAccept = agreedTo7Percent && agreedToGatewayPolicy && agreedToSettlements;

  const handleAccept = () => {
    if (!canAccept) return;
    setIsSubmitting(true);

    setTimeout(() => {
      PractitionerFinanceService.acceptCommercialTerms({
        practiceId,
        acceptedByUserId: 'dr_mokoena_001',
        enableOnlinePayment: enableOnline,
        enablePayAtPractice: enablePracticeFlex,
      });

      setIsSubmitting(false);
      onAccepted();
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative animate-in zoom-in-95 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Commercial Terms & Fee Agreement</h3>
                <Badge variant="verified" size="sm">
                  v{COMMERCIAL_TERMS_VERSION}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Transparent practitioner commercial terms for DigitalNexCare
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

        {/* Free Guarantees */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <p className="font-bold text-slate-900">Zero Onboarding & Listing Fees</p>
          <ul className="grid grid-cols-2 gap-2 text-slate-600">
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> Free Practice Profile
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> Free Professional Verification
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> Free Directory Indexing
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> Free Calendar Setup
            </li>
          </ul>
        </div>

        {/* Commercial Models Summary */}
        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#176BFF] flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" /> 1. Pay Online via DigitalNexCare
              </span>
              <span className="font-bold text-slate-900">7.00% Platform Fee</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              When patients prepay consultations online, DigitalNexCare retains 7% on successful bookings.
              Payment processing gateway fees (Paystack) are separate and transparently itemized. Weekly
              settlements are paid to your verified South African bank account every Monday.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> 2. Pay at Practice (Practice Flex)
              </span>
              <span className="font-bold text-slate-900">R149.00 / month</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Accept patients who pay directly at your reception. Includes 10 completed consultations per
              monthly billing cycle. Any additional completed booking is billed at R25.00 each. Cancelled
              or test bookings are never charged.
            </p>
          </div>
        </div>

        {/* Agreements Checkboxes */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-700">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedTo7Percent}
              onChange={(e) => setAgreedTo7Percent(e.target.checked)}
              className="mt-0.5 rounded text-[#176BFF] focus:ring-[#176BFF]"
            />
            <span className="text-[11px]">
              I agree to the <strong>7% DigitalNexCare platform fee</strong> on all successful online prepaid
              consultations.
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToGatewayPolicy}
              onChange={(e) => setAgreedToGatewayPolicy(e.target.checked)}
              className="mt-0.5 rounded text-[#176BFF] focus:ring-[#176BFF]"
            />
            <span className="text-[11px]">
              I understand payment gateway processing fees are separate from the platform fee and borne by the
              practice.
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToSettlements}
              onChange={(e) => setAgreedToSettlements(e.target.checked)}
              className="mt-0.5 rounded text-[#176BFF] focus:ring-[#176BFF]"
            />
            <span className="text-[11px]">
              I accept the <strong>weekly settlement model</strong> (Africa/Johannesburg cutoffs, settlements
              cleared Mondays).
            </span>
          </label>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAccept}
            disabled={!canAccept}
            isLoading={isSubmitting}
          >
            Accept Commercial Terms & Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
