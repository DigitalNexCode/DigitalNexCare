import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DigitalNexCareProvider, AppointmentSlot } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PractitionerReviewsModal } from '../reviews/PractitionerReviewsModal';
import {
  CheckCircle2,
  Star,
  MapPin,
  Calendar,
  Clock,
  Video,
  Building,
  ShieldCheck,
  ChevronRight,
  Stethoscope,
  Sparkles,
  Car,
  Footprints,
  Navigation,
} from 'lucide-react';
import { calculateTravelEstimate, getDirectionsUrl } from '../../lib/geo';

export interface ProviderCardProps {
  provider: DigitalNexCareProvider;
  selectedSlotId?: string;
  onSelectSlot?: (slotId: string, slot: AppointmentSlot) => void;
  userDistanceKm?: number;
  compact?: boolean;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  selectedSlotId,
  onSelectSlot,
  userDistanceKm,
  compact = false,
}) => {
  const [activeSlotId, setActiveSlotId] = useState<string | undefined>(selectedSlotId);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

  const handleSlotClick = (slot: AppointmentSlot, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveSlotId(slot.id);
    if (onSelectSlot) {
      onSelectSlot(slot.id, slot);
    }
  };

  const bookingUrl = activeSlotId
    ? `/book/${provider.id}?slot=${activeSlotId}`
    : `/book/${provider.id}`;

  return (
    <div
      id={`provider-card-${provider.id}`}
      className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-200 transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between"
    >
      <div>
        {/* Top Header: Photo, Verified Name, Rating */}
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <img
              src={provider.photoUrl}
              alt={provider.fullName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-xs"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback avatar if external image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div
              className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-xs"
              title="Verified by HPCSA/Statutory Council"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/providers/${provider.slug}`}
                className="text-lg sm:text-xl font-black text-slate-900 hover:text-[#176BFF] transition-colors truncate"
              >
                {provider.fullName}
              </Link>
              <Badge variant="verified" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                Verified Provider
              </Badge>
            </div>

            <p className="text-sm font-bold text-[#176BFF] mt-0.5 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 flex-shrink-0 text-[#176BFF]" />
              <span>{provider.specialty}</span>
              {provider.experienceYears && (
                <span className="text-xs font-normal text-slate-400">
                  • {provider.experienceYears}+ yrs exp
                </span>
              )}
            </p>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
              <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate font-semibold">{provider.practiceName}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 flex-wrap">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>
                {provider.suburb}, {provider.city} • {provider.province}
              </span>
              {userDistanceKm !== undefined && (
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5 sm:mt-0">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 text-[11px] font-bold text-[#176BFF]">
                    {userDistanceKm.toFixed(1)} km
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">
                    <Car className="w-3 h-3 text-[#176BFF]" />
                    <span>{calculateTravelEstimate(userDistanceKm).driveText}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">
                    <Footprints className="w-3 h-3 text-emerald-600" />
                    <span>{calculateTravelEstimate(userDistanceKm).walkText}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Rating Block */}
          <div className="hidden sm:flex flex-col items-end flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsReviewsOpen(true)}
              className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-xl border border-amber-200/80 transition-colors cursor-pointer text-left group"
              title="View verified patient reviews"
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-amber-900 group-hover:text-amber-950">{provider.rating.toFixed(1)}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsReviewsOpen(true)}
              className="text-[11px] text-slate-500 hover:text-[#176BFF] underline mt-1 font-medium cursor-pointer"
            >
              {provider.reviewCount} verified reviews
            </button>
          </div>
        </div>

        {/* Accepted Medical Aids & Consultation Modes */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 flex-wrap">
            <span className="font-bold text-slate-700">Medical Aids:</span>
            <div className="flex flex-wrap gap-1">
              {(provider.acceptedMedicalAids || []).slice(0, 3).map((aid) => (
                <span
                  key={aid}
                  className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md"
                >
                  {aid}
                </span>
              ))}
              {(provider.acceptedMedicalAids?.length || 0) > 3 && (
                <span className="text-slate-400 text-[11px] font-medium self-center">
                  +{(provider.acceptedMedicalAids?.length || 0) - 3} more
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {provider.offersInPerson && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                In-person
              </span>
            )}
            {provider.offersVirtual && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#176BFF] bg-blue-50 px-2.5 py-1 rounded-lg">
                <Video className="w-3 h-3" /> Virtual
              </span>
            )}
          </div>
        </div>

        {/* Real Live Appointment Slots Selector */}
        {!compact && provider.availableSlots && provider.availableSlots.length > 0 && (
          <div className="mt-4 bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200/70">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#176BFF]" />
                Real Appointment Availability
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Direct booking • Free for all patients
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(provider.availableSlots || []).slice(0, 4).map((slot) => {
                const isSelected = activeSlotId === slot.id;
                const displayDay =
                  slot.date === '2026-09-02'
                    ? 'Today'
                    : slot.date === '2026-09-03'
                    ? 'Tomorrow'
                    : slot.date;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={(e) => handleSlotClick(slot, e)}
                    className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border transition-all text-center ${
                      isSelected
                        ? 'bg-[#176BFF] text-white border-[#176BFF] shadow-xs'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-[#176BFF] hover:bg-blue-50/50'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isSelected ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {displayDay}
                    </span>
                    <span
                      className={`text-xs font-black flex items-center gap-1 mt-0.5 ${
                        isSelected ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      <Clock
                        className={`w-3 h-3 ${isSelected ? 'text-blue-200' : 'text-[#176BFF]'}`}
                      />
                      {slot.startTime}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
            Consultation from
          </span>
          <span className="text-base sm:text-lg font-black text-slate-900">
            R{provider.consultationFeeZAR}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/providers/${provider.slug}`}>
            <Button variant="outline" size="sm" className="font-bold">
              View Profile
            </Button>
          </Link>
          <Link to={bookingUrl}>
            <Button
              variant="primary"
              size="sm"
              className="font-extrabold uppercase tracking-wide text-xs px-4"
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              BOOK APPOINTMENT
            </Button>
          </Link>
        </div>
      </div>

      {/* Verified Reviews Modal */}
      <PractitionerReviewsModal
        isOpen={isReviewsOpen}
        onClose={() => setIsReviewsOpen(false)}
        practitionerId={provider.id}
        practitionerName={provider.fullName}
        specialty={provider.specialty}
        overallRating={provider.rating}
        totalReviewCount={provider.reviewCount}
        isUnlocked={true}
      />
    </div>
  );
};
