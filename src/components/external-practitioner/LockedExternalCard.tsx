import React, { useState } from 'react';
import { ExternalPractitionerLocked } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAuth } from '../../lib/auth/context';
import { SubscriptionModal } from '../subscription/SubscriptionModal';
import { PractitionerReviewsModal } from '../reviews/PractitionerReviewsModal';
import {
  Lock,
  MapPin,
  Star,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  Eye,
  Building2,
  CheckCircle2,
} from 'lucide-react';

interface LockedExternalCardProps {
  practitioner: ExternalPractitionerLocked;
  userDistanceKm?: number;
  onUnlockedSuccess?: () => void;
}

export const LockedExternalCard: React.FC<LockedExternalCardProps> = ({
  practitioner,
  userDistanceKm,
  onUnlockedSuccess,
}) => {
  const { revealsRemaining, unlockPractitioner } = useAuth();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);

  const displayDistance = userDistanceKm || practitioner.approximateDistanceKm || 4.2;

  const handleReveal = () => {
    if (revealsRemaining <= 0) {
      setIsSubscriptionModalOpen(true);
      return;
    }

    setIsUnlocking(true);
    setError(null);
    const res = unlockPractitioner(practitioner.id);
    setIsUnlocking(false);

    if (res.success) {
      if (onUnlockedSuccess) onUnlockedSuccess();
    } else {
      setError(res.message || 'Unable to unlock. Please view subscription plans.');
      setIsSubscriptionModalOpen(true);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between">
        {/* Decorative top pattern indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-300" />

        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                  {practitioner.anonymizedTitle}
                </h3>
                <Badge variant="warning" size="sm" icon={<Lock className="w-3 h-3" />}>
                  Practitioner Details Locked
                </Badge>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-500" />
                  Private Practice
                </span>
                {practitioner.rating && practitioner.rating >= 4.5 && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 text-[11px] font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    Highly Rated
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-slate-600 mt-1">
                {practitioner.specialty}
              </p>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {practitioner.generalArea}, {practitioner.city} • {practitioner.province}
                </span>
                <span>•</span>
                <span className="font-semibold text-slate-700">
                  Approximately {displayDistance} km away
                </span>
              </div>
            </div>

            {/* Rating Box */}
            {practitioner.rating && (
              <button
                type="button"
                onClick={() => setIsReviewsModalOpen(true)}
                className="flex items-center gap-1 bg-slate-50 hover:bg-amber-50/60 px-2.5 py-1 rounded-xl border border-slate-200/80 transition-colors cursor-pointer text-left group"
                title="View reviews and patient feedback"
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-slate-700 group-hover:text-amber-700">
                  {practitioner.rating.toFixed(1)}
                </span>
                {practitioner.reviewCount && (
                  <span className="text-xs text-slate-400 group-hover:text-amber-600 underline">({practitioner.reviewCount} reviews)</span>
                )}
              </button>
            )}
          </div>

          {/* Services & Metadata preview */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(practitioner.services || []).slice(0, 3).map((service, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
              >
                {service}
              </span>
            ))}
            {practitioner.offersVirtual && (
              <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Virtual Available
              </span>
            )}
            {practitioner.offersInPerson && (
              <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                In-Person Available
              </span>
            )}
          </div>

          {/* Masked Content Notice Box */}
          <div className="mt-3.5 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" /> Protected External Directory Contact
              </span>
              <span className="text-[11px]">HPCSA / Statutory Register</span>
            </div>

            {/* Blurred Placeholder Rows */}
            <div className="space-y-2 select-none filter blur-[4.5px] opacity-70">
              <div className="h-3.5 bg-slate-300 rounded w-3/4" />
              <div className="h-3.5 bg-slate-300 rounded w-1/2" />
              <div className="h-3.5 bg-slate-300 rounded w-2/3" />
            </div>
          </div>

          {error && (
            <div className="mt-2 text-xs text-[#FF3D71] flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer / CTA Actions */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {revealsRemaining > 0 ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> {revealsRemaining} reveal
                {revealsRemaining === 1 ? '' : 's'} remaining in your plan
              </span>
            ) : (
              <span className="text-slate-500 font-medium">Monthly reveals limit reached (2/2)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {revealsRemaining > 0 ? (
              <Button
                variant="primary"
                size="sm"
                isLoading={isUnlocking}
                onClick={handleReveal}
                leftIcon={<Eye className="w-3.5 h-3.5" />}
              >
                Reveal Contact Info (1 Credit)
              </Button>
            ) : (
              <Button
                variant="accent"
                size="sm"
                onClick={() => setIsSubscriptionModalOpen(true)}
                rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
              >
                SUBSCRIBE TO SEE THIS PRACTITIONER
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Paywall Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onUpgradeSuccess={() => {
          if (onUnlockedSuccess) onUnlockedSuccess();
        }}
      />

      {/* Reviews & Patient Ratings Modal (Locked View) */}
      <PractitionerReviewsModal
        isOpen={isReviewsModalOpen}
        onClose={() => setIsReviewsModalOpen(false)}
        practitionerId={practitioner.id}
        practitionerName={practitioner.anonymizedTitle}
        specialty={practitioner.specialty}
        overallRating={practitioner.rating || 4.7}
        totalReviewCount={practitioner.reviewCount || 18}
        isUnlocked={false}
        onUnlockRequest={() => {
          setIsReviewsModalOpen(false);
          handleReveal();
        }}
      />
    </>
  );
};
