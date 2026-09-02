import React from 'react';
import { Link } from 'react-router-dom';
import { PatientLayout } from '../../components/layout/PatientLayout';
import { useAuth } from '../../lib/auth/context';
import { MOCK_UNLOCKED_EXTERNAL } from '../../data/mockDatabase';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Phone, MapPin, ExternalLink, Compass } from 'lucide-react';

export const PatientExternalUnlocksPage: React.FC = () => {
  const { revealsRemaining, subscriptionPlan } = useAuth();

  return (
    <PatientLayout
      title="External Practitioner Unlocks"
      subtitle="View all external directory practitioners you have revealed during your current billing period."
    >
      <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-500 font-semibold">Current Allowance Status</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">
            {revealsRemaining} Reveals Available This Month
          </div>
          <p className="text-xs text-slate-500">
            Re-opening previously revealed practitioners never consumes additional credits.
          </p>
        </div>

        <Link to="/pricing">
          <Button variant="outline" size="sm">
            Upgrade Plan
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {MOCK_UNLOCKED_EXTERNAL.map((prac) => (
          <div
            key={prac.id}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{prac.fullName}</h3>
                <Badge variant="slate" size="sm">
                  External Practice
                </Badge>
              </div>
              <p className="text-xs font-semibold text-[#176BFF] mt-0.5">
                {prac.specialty} • {prac.practiceName}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <a href={`tel:${prac.phone}`} className="font-semibold text-slate-800 hover:underline">
                  {prac.phone}
                </a>
                <span>•</span>
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{prac.address}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a href={`tel:${prac.phone}`}>
                <Button variant="primary" size="sm">
                  Call Practice
                </Button>
              </a>
            </div>
          </div>
        ))}
      </div>
    </PatientLayout>
  );
};
