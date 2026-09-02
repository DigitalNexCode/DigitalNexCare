import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_UNLOCKED_EXTERNAL, MOCK_LOCKED_EXTERNAL } from '../../data/mockDatabase';
import { useAuth } from '../../lib/auth/context';
import { UnlockedExternalCard } from '../../components/external-practitioner/UnlockedExternalCard';
import { LockedExternalCard } from '../../components/external-practitioner/LockedExternalCard';
import { Badge } from '../../components/ui/Badge';
import { ArrowLeft, Compass, Info } from 'lucide-react';

export const ExternalPractitionerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { unlockedIds } = useAuth();

  const unlockedPractitioner = MOCK_UNLOCKED_EXTERNAL.find((p) => p.id === id);
  const lockedPractitioner = MOCK_LOCKED_EXTERNAL.find((p) => p.id === id);

  const isDynamicallyUnlocked = id ? unlockedIds.includes(id) : false;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Link
          to="/find-care"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Healthcare Directory
        </Link>

        {/* Informational Banner */}
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-slate-700 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#176BFF] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>External Directory Record:</strong> This healthcare practice is indexed from public registers. DigitalNexCare does not manage direct scheduling for external practitioners. Contact the practice directly using the provided details.
          </p>
        </div>

        {/* Render Appropriate Card */}
        {unlockedPractitioner || isDynamicallyUnlocked ? (
          <UnlockedExternalCard
            practitioner={
              unlockedPractitioner || {
                id: id || 'ext-002',
                fullName: 'Dr. Kobus Van Der Merwe',
                practiceName: 'Centurion Family Care Practice',
                specialty: 'General Practitioner',
                address: '14 John Vorster Drive, Centurion, Gauteng, 0157',
                suburb: 'Centurion',
                city: 'Pretoria',
                province: 'Gauteng',
                phone: '+27 12 663 8810',
                email: 'info@centurionfamilycare.co.za',
                website: 'https://centurionfamilycare.co.za',
                rating: 4.6,
                reviewCount: 19,
                sourceAttribution: 'Public Practice Directory',
                discoveredAt: '2026-08-20',
              }
            }
          />
        ) : lockedPractitioner ? (
          <LockedExternalCard practitioner={lockedPractitioner} />
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
            <h2 className="text-base font-bold text-slate-800">Practitioner Record Not Found</h2>
            <Link to="/find-care" className="text-xs text-[#176BFF] font-semibold mt-2 inline-block">
              Return to Find Care
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
