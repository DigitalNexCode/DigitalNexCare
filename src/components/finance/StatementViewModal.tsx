import React from 'react';
import { FinancialStatement } from '../../types/finance';
import { FinancialMath } from '../../lib/finance/financial-math';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Printer, X, Building, Calendar, DollarSign, ArrowUpRight, ArrowDownLeft, ShieldCheck } from 'lucide-react';

interface StatementViewModalProps {
  statement: FinancialStatement;
  onClose: () => void;
}

export const StatementViewModal: React.FC<StatementViewModalProps> = ({ statement, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative animate-in zoom-in-95 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#07111F] text-[#00E5D4] flex items-center justify-center font-black">
              DNC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {statement.statementType === 'WEEKLY_SETTLEMENT'
                    ? 'Weekly Settlement Statement'
                    : 'Monthly Practice Statement'}
                </h3>
                <Badge variant={statement.status === 'SETTLED' ? 'verified' : 'primary'} size="sm">
                  {statement.status}
                </Badge>
              </div>
              <p className="text-xs font-mono text-slate-500">Statement No: {statement.statementNumber}</p>
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

        {/* Practice & Period Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
          <div>
            <span className="text-slate-500 block mb-1">Healthcare Practice</span>
            <p className="font-bold text-slate-900 text-sm">{statement.practiceName}</p>
            <p className="text-slate-600">Payout Account: <strong>{statement.destinationAccountMasked}</strong></p>
          </div>
          <div>
            <span className="text-slate-500 block mb-1">Settlement Period</span>
            <p className="font-semibold text-slate-900">
              {new Date(statement.periodStart).toLocaleDateString('en-ZA')} –{' '}
              {new Date(statement.periodEnd).toLocaleDateString('en-ZA')}
            </p>
            <p className="text-slate-500 font-mono text-[11px]">Timezone: Africa/Johannesburg (SAST)</p>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Gross Bookings</span>
            <span className="text-base font-bold text-slate-900">
              {FinancialMath.formatCentsToZAR(statement.grossPaidBookingsCents)}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100">
            <span className="text-[11px] text-rose-700 block">DigitalNexCare 7%</span>
            <span className="text-base font-bold text-rose-900">
              -{FinancialMath.formatCentsToZAR(statement.platformFeesCents)}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200">
            <span className="text-[11px] text-slate-600 block">Gateway Fees</span>
            <span className="text-base font-bold text-slate-800">
              -{FinancialMath.formatCentsToZAR(statement.gatewayFeesCents)}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-[11px] text-emerald-800 font-semibold block">Net Settlement</span>
            <span className="text-base font-black text-emerald-950">
              {FinancialMath.formatCentsToZAR(statement.netSettlementOrDueCents)}
            </span>
          </div>
        </div>

        {/* Practice Flex Monthly Addendum if present */}
        {statement.statementType === 'MONTHLY_PRACTICE_SUMMARY' && (
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-[#176BFF]">
              <span>Practice Flex (Pay-at-Practice Model)</span>
              <span>R149.00 / month Base</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-slate-700 pt-1 border-t border-blue-200/60">
              <div>
                <span className="text-slate-500 block text-[10px]">Completed Bookings</span>
                <span className="font-bold">{statement.totalCompletedPayAtPracticeBookings}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Included in Base</span>
                <span className="font-bold">10 free</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Overage (@ R25 ea)</span>
                <span className="font-bold">{FinancialMath.formatCentsToZAR(statement.practiceFlexOverageCents)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Line Items Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Itemized Line Items</h4>
          <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="p-2.5 font-semibold">Date</th>
                  <th className="p-2.5 font-semibold">Description</th>
                  <th className="p-2.5 font-semibold">Category</th>
                  <th className="p-2.5 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statement.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="p-2.5 text-slate-500 font-mono text-[11px]">{item.date}</td>
                    <td className="p-2.5 font-medium text-slate-900">
                      {item.description}
                      <span className="block text-[10px] text-slate-400 font-mono">{item.reference}</span>
                    </td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {item.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={`p-2.5 text-right font-bold ${item.direction === 'CREDIT' ? 'text-slate-900' : 'text-rose-600'}`}>
                      {item.direction === 'CREDIT' ? '+' : '-'}
                      {FinancialMath.formatCentsToZAR(item.amountCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            <span>Cryptographically sealed financial statement record</span>
          </div>
          <Button variant="primary" onClick={onClose} size="sm">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
