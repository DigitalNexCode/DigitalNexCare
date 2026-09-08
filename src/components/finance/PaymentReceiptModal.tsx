import React from 'react';
import { PaymentReceipt } from '../../types/finance';
import { FinancialMath } from '../../lib/finance/financial-math';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Printer, X, ShieldCheck, CheckCircle2, Building, Calendar, User, Clock, FileText } from 'lucide-react';

interface PaymentReceiptModalProps {
  receipt: PaymentReceipt;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({ receipt, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative animate-in zoom-in-95">
        {/* Header Close & Print */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#176BFF]/10 text-[#176BFF] flex items-center justify-center font-black">
              DNC
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Official Payment Receipt</h3>
              <p className="text-[11px] font-mono text-slate-500">{receipt.receiptNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1.5 text-xs">
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Brand & Status Banner */}
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-950">Payment Successfully Verified</p>
              <p className="text-[11px] text-emerald-800">
                Processed via {receipt.paymentGateway} • Ref: {receipt.paymentReference}
              </p>
            </div>
          </div>
          <Badge variant="verified" size="sm">
            Paid
          </Badge>
        </div>

        {/* Receipt Details Breakdown */}
        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Patient
              </span>
              <span className="font-bold text-slate-900">{receipt.patientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" /> Practitioner & Practice
              </span>
              <span className="font-bold text-slate-900 text-right">
                {receipt.practitionerName}
                <br />
                <span className="text-[11px] font-normal text-slate-500">{receipt.practiceName}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date & Time
              </span>
              <span className="font-bold text-slate-900">
                {receipt.appointmentDate} • {receipt.appointmentTime}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Consultation
              </span>
              <span className="font-semibold text-[#176BFF]">{receipt.appointmentType}</span>
            </div>
          </div>

          {/* Amount Paid Highlight */}
          <div className="p-4 rounded-2xl bg-[#07111F] text-white flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400">Total Amount Paid</p>
              <p className="text-2xl font-black text-white">
                {FinancialMath.formatCentsToZAR(receipt.grossAmountCents)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-400">Currency</p>
              <p className="text-xs font-bold font-mono text-[#00E5D4]">{receipt.currency}</p>
            </div>
          </div>
        </div>

        {/* Disclaimer & Support */}
        <div className="space-y-2 border-t border-slate-100 pt-4 text-[10px] text-slate-500 leading-relaxed">
          <p className="italic">{receipt.termsDisclaimer}</p>
          <div className="flex items-center justify-between font-mono pt-1 text-[9px] text-slate-400">
            <span>Date: {new Date(receipt.paidAt).toLocaleString('en-ZA')}</span>
            <span>{receipt.supportContact}</span>
          </div>
        </div>

        <div className="pt-2">
          <Button variant="primary" className="w-full" onClick={onClose}>
            Close Receipt
          </Button>
        </div>
      </div>
    </div>
  );
};
