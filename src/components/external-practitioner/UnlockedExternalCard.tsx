import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalPractitionerUnlocked } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Phone,
  Mail,
  MapPin,
  Star,
  ExternalLink,
  Navigation,
  Compass,
  Car,
  Footprints,
} from 'lucide-react';
import { calculateTravelEstimate } from '../../lib/geo';

interface UnlockedExternalCardProps {
  practitioner: ExternalPractitionerUnlocked;
}

export const UnlockedExternalCard: React.FC<UnlockedExternalCardProps> = ({ practitioner }) => {
  const approxDistance = 3.2; // Default realistic distance in km
  const travel = calculateTravelEstimate(approxDistance);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/external-practitioners/${practitioner.id}`}
                className="text-lg sm:text-xl font-bold text-slate-900 hover:text-[#176BFF] transition-colors"
              >
                {practitioner.fullName}
              </Link>
              <Badge variant="slate" size="sm" icon={<Compass className="w-3 h-3" />}>
                External Practitioner
              </Badge>
            </div>

            <p className="text-sm font-semibold text-slate-700 mt-0.5">{practitioner.specialty}</p>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <span className="font-medium text-slate-700">{practitioner.practiceName}</span>
              <span>•</span>
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {practitioner.suburb}, {practitioner.city}
              </span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold text-slate-800">{practitioner.rating.toFixed(1)}</span>
            <span className="text-xs text-slate-400">({practitioner.reviewCount})</span>
          </div>
        </div>

        {/* Destination Address & Travel Estimates */}
        <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
          <div className="font-semibold text-slate-800 mb-0.5">Physical Practice Address:</div>
          <div>{practitioner.address}</div>
          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-3 text-[11px] text-slate-600 flex-wrap">
            <span className="font-bold text-slate-800">~{approxDistance} km</span>
            <span className="inline-flex items-center gap-1 text-slate-700">
              <Car className="w-3.5 h-3.5 text-[#176BFF]" />
              <span>{travel.driveText}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-slate-700">
              <Footprints className="w-3.5 h-3.5 text-emerald-600" />
              <span>{travel.walkText}</span>
            </span>
          </div>
        </div>

        {/* Contact Details (Unlocked) */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 p-2 rounded-lg bg-slate-50/50">
            <Phone className="w-3.5 h-3.5 text-[#176BFF] flex-shrink-0" />
            <a href={`tel:${practitioner.phone}`} className="font-semibold hover:underline">
              {practitioner.phone}
            </a>
          </div>

          {practitioner.email && (
            <div className="flex items-center gap-2 text-slate-700 p-2 rounded-lg bg-slate-50/50 truncate">
              <Mail className="w-3.5 h-3.5 text-[#176BFF] flex-shrink-0" />
              <a href={`mailto:${practitioner.email}`} className="truncate hover:underline">
                {practitioner.email}
              </a>
            </div>
          )}
        </div>

        {/* Source attribution & non-bookable notice */}
        <div className="mt-3 text-[11px] text-slate-400 italic">
          Sourced from: {practitioner.sourceAttribution}. External practitioner: Contact directly for appointments.
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>Unlocked via your NexCare Plan</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {practitioner.website && (
            <a href={practitioner.website} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                Website
              </Button>
            </a>
          )}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(practitioner.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`Get Directions (${travel.driveMinutes} min drive • ${travel.walkMinutes} min walk)`}
          >
            <Button variant="outline" size="sm" rightIcon={<Navigation className="w-3.5 h-3.5" />}>
              Directions ({travel.driveMinutes}m drive)
            </Button>
          </a>
          <a href={`tel:${practitioner.phone}`}>
            <Button variant="primary" size="sm" leftIcon={<Phone className="w-3.5 h-3.5" />}>
              Call Practice
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};
