import React from 'react';
import { Link } from 'react-router-dom';
import { PatientLayout } from '../../components/layout/PatientLayout';
import { useAuth } from '../../lib/auth/context';
import { MOCK_UNLOCKED_EXTERNAL } from '../../data/mockDatabase';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Unlock,
  CreditCard,
  Calendar,
  AlertCircle,
  Eye,
  Building,
  Phone,
  Globe,
  MapPin,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

export const PatientUsagePage: React.FC = () => {
  const { subscriptionPlan, revealsRemaining } = useAuth();

  const planMax =
    subscriptionPlan === 'NEXCARE_FREE'
      ? 2
      : subscriptionPlan === 'NEXCARE_ACCESS'
      ? 5
      : subscriptionPlan === 'NEXCARE_PLUS'
      ? 20
      : 999;

  const usedCount = Math.max(0, planMax - revealsRemaining);
  const percentUsed = Math.min(100, Math.round((usedCount / planMax) * 100));

  return (
    <PatientLayout
      title="Subscription Usage & Quota"
      subtitle="Monitor your monthly external practitioner reveals, unlocked directory history, and remaining quota."
    >
      <div className="space-y-6">
        {/* Usage Overview Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {subscriptionPlan.replace('NEXCARE_', '')} Plan Quota
                </h2>
                <Badge variant={revealsRemaining > 0 ? 'verified' : 'danger'} size="sm">
                  {revealsRemaining > 0 ? `${revealsRemaining} Reveals Available` : 'Quota Exhausted'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Current Billing Period: 01 Sept 2026 – 30 Sept 2026 (Renews on 01 Oct 2026)
              </p>
            </div>

            <Link to="/patient/subscription">
              <Button variant="outline" size="sm">
                Upgrade Plan
              </Button>
            </Link>
          </div>

          {/* Quota Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600">
                Reveals Used: <strong className="text-slate-900">{usedCount}</strong> of{' '}
                <strong>{planMax === 999 ? 'Unlimited' : planMax}</strong>
              </span>
              <span className="text-[#176BFF] font-bold">{percentUsed}% consumed</span>
            </div>

            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  percentUsed > 80 ? 'bg-[#FF3D71]' : 'bg-[#176BFF]'
                }`}
                style={{ width: `${percentUsed}%` }}
              />
            </div>
          </div>
        </div>

        {/* Unlocked History Table */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Unlock className="w-4 h-4 text-emerald-600" /> Revealed External Practitioners
              </h3>
              <p className="text-xs text-slate-500">
                Re-visiting already unlocked external practitioners consumes zero additional quota
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {MOCK_UNLOCKED_EXTERNAL.length} Practitioner{MOCK_UNLOCKED_EXTERNAL.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            {MOCK_UNLOCKED_EXTERNAL.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{item.fullName}</h4>
                    <Badge variant="slate" size="sm">
                      External Practitioner
                    </Badge>
                  </div>
                  <p className="text-xs text-[#176BFF] font-semibold">
                    {item.specialty} • {item.practiceName}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {item.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {item.suburb}, {item.city}
                    </span>
                    <span className="text-slate-400">
                      Verified {item.lastVerifiedAt}
                    </span>
                  </div>
                </div>

                <Link to={`/external-practitioners/${item.slug}`}>
                  <Button variant="outline" size="sm" rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                    View Unlocked Profile
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PatientLayout>
  );
};
