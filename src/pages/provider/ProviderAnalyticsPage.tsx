import React from 'react';
import { ProviderLayout } from '../../components/layout/ProviderLayout';
import { Chunk8OperationsService } from '../../lib/admin/chunk8-service';
import { Badge } from '../../components/ui/Badge';
import {
  TrendingUp,
  Users,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  CreditCard,
  BarChart3,
  Percent,
} from 'lucide-react';

export const ProviderAnalyticsPage: React.FC = () => {
  const analytics = Chunk8OperationsService.getProviderAnalytics('prov-001');

  return (
    <ProviderLayout
      title="Practice Analytics & Conversion Metrics"
      subtitle="Track patient discovery impressions, slot conversion rates, cancellation trends, and clinical revenue."
    >
      <div className="space-y-6">
        {/* Top KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Profile Discovery Views</span>
              <Eye className="w-4 h-4 text-[#176BFF]" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {analytics.profileViews.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>+18.4% vs last month</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Total Bookings Placed</span>
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {analytics.totalBookings}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {analytics.confirmedBookings} completed/confirmed
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Slot Conversion Rate</span>
              <Percent className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {analytics.conversionRatePercent}%
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              Views → Confirmed Bookings
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Estimated Practice Revenue</span>
              <span className="text-xs font-bold text-slate-400">ZAR</span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              R{(analytics.revenueZAR).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Direct Medical Aid & Card
            </div>
          </div>
        </div>

        {/* Quality & Efficiency Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Cancellation Rate</span>
              <span className="text-xs font-bold text-slate-900">{analytics.cancellationRatePercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full" style={{ width: `${analytics.cancellationRatePercent}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">
              {analytics.cancelledBookings} total cancellations. Well below the national benchmark of 11.2%.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">No-Show Rate</span>
              <span className="text-xs font-bold text-slate-900">{analytics.noShowRatePercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full" style={{ width: `${analytics.noShowRatePercent}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">
              {analytics.noShows} missed appointments. Automated WhatsApp reminders reduce no-shows by ~68%.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Patient Satisfaction Score</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                {analytics.satisfactionScore} / 5.0
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${(analytics.satisfactionScore / 5) * 100}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">
              98.2% positive sentiment across bedside manner and punctuality.
            </p>
          </div>
        </div>

        {/* Monthly Performance Trend Table */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#176BFF]" /> Monthly Discovery & Appointment Volume
            </h3>
            <Badge variant="verified" size="sm">
              5 Months Trajectory
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Month</th>
                  <th className="py-3 px-4 font-bold">Profile Views</th>
                  <th className="py-3 px-4 font-bold">Bookings Placed</th>
                  <th className="py-3 px-4 font-bold">Cancellations</th>
                  <th className="py-3 px-4 font-bold">Conversion Rate</th>
                  <th className="py-3 px-4 font-bold">Average Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {analytics.monthlyTrend.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{m.month}</td>
                    <td className="py-3.5 px-4">{m.views.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">{m.bookings}</td>
                    <td className="py-3.5 px-4 text-slate-500">{m.cancellations}</td>
                    <td className="py-3.5 px-4 font-bold text-[#176BFF]">
                      {((m.bookings / m.views) * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 flex items-center gap-1 font-bold text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                      {m.rating}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
};
