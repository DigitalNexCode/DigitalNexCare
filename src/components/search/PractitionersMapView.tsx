import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DigitalNexCareProvider, ExternalPractitionerUnlocked, ExternalPractitionerLocked } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  MapPin,
  ShieldCheck,
  Star,
  Compass,
  Lock,
  ExternalLink,
  LocateFixed,
  Layers,
  Building,
  Route,
  Car,
  Footprints,
  Calendar,
  CheckCircle2,
  Navigation,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { calculateDistanceKm, calculateTravelEstimate, getDirectionsUrl } from '../../lib/geo';

interface PractitionersMapViewProps {
  verifiedProviders?: DigitalNexCareProvider[];
  unlockedExternal?: ExternalPractitionerUnlocked[];
  lockedExternal?: ExternalPractitionerLocked[];
  selectedProvince?: string;
  onSelectPractitioner?: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export const PractitionersMapView: React.FC<PractitionersMapViewProps> = ({
  verifiedProviders = [],
  unlockedExternal = [],
  lockedExternal = [],
  selectedProvince,
  onSelectPractitioner,
  userLocation: propUserLocation,
}) => {
  // Default user location in South Africa (Pretoria / Tshwane CBD coordinates)
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    label: string;
    isCustomGPS: boolean;
  }>({
    lat: propUserLocation?.lat || -25.7479,
    lng: propUserLocation?.lng || 28.2293,
    label: propUserLocation ? 'Your Search Location' : 'Pretoria, Gauteng (Default)',
    isCustomGPS: Boolean(propUserLocation),
  });

  const [isLocating, setIsLocating] = useState(false);
  const [mapType, setMapType] = useState<'m' | 'k'>('m'); // 'm' for roadmap, 'k' for satellite
  const [mapZoom, setMapZoom] = useState(14);
  const [hoveredPractitionerId, setHoveredPractitionerId] = useState<string | null>(null);

  // Combine practitioners for unified map listing & calculations
  const allPractitioners = useMemo(() => {
    const verified = verifiedProviders || [];
    const unlocked = unlockedExternal || [];
    const locked = lockedExternal || [];

    return [
      ...verified.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.fullName,
        specialty: p.specialty,
        practice: p.practiceName,
        address: `${p.address}, ${p.suburb}, ${p.city}`,
        suburbCity: `${p.suburb}, ${p.city}`,
        province: p.province,
        type: 'VERIFIED' as const,
        rating: p.rating,
        reviewCount: p.reviewCount,
        fee: p.consultationFeeZAR,
        photo: p.photoUrl,
        coordinates: {
          latitude: p.coordinates?.latitude || -25.7479,
          longitude: p.coordinates?.longitude || 28.2293,
        },
        services: (p as any).servicesOffered || p.services || [],
        availableSlot: p.availableSlots?.[0],
      })),
      ...unlocked.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.fullName,
        specialty: p.specialty,
        practice: p.practiceName,
        address: `${p.address}, ${p.suburb}, ${p.city}`,
        suburbCity: `${p.suburb}, ${p.city}`,
        province: p.province,
        type: 'EXTERNAL_UNLOCKED' as const,
        rating: p.rating,
        reviewCount: p.reviewCount,
        fee: undefined,
        photo: undefined,
        coordinates: {
          latitude: p.coordinates?.latitude || -25.75,
          longitude: p.coordinates?.longitude || 28.23,
        },
        services: p.services || [],
        availableSlot: undefined,
      })),
      ...locked.map((p) => ({
        id: p.id,
        slug: undefined,
        name: p.anonymizedTitle,
        specialty: p.specialty,
        practice: 'Private Healthcare Practice',
        address: `${p.generalArea}, ${p.city}`,
        suburbCity: `${p.generalArea}, ${p.city}`,
        province: p.province,
        type: 'EXTERNAL_LOCKED' as const,
        rating: p.rating,
        reviewCount: p.reviewCount,
        fee: undefined,
        photo: undefined,
        coordinates: {
          latitude: -25.755,
          longitude: 28.235,
        },
        services: p.services || [],
        availableSlot: undefined,
      })),
    ].map((item) => {
      const distanceKm = calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        item.coordinates.latitude,
        item.coordinates.longitude
      );
      const travel = calculateTravelEstimate(distanceKm);
      return { ...item, distanceKm, travel };
    });
  }, [verifiedProviders, unlockedExternal, lockedExternal, userLocation]);

  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string | null>(
    allPractitioners[0]?.id || null
  );

  // Active practitioner is hovered one if present, otherwise the selected one
  const activePractitionerId = hoveredPractitionerId || selectedPractitionerId || allPractitioners[0]?.id || null;
  const activePractitioner =
    allPractitioners.find((p) => p.id === activePractitionerId) || allPractitioners[0];

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: 'Your Current GPS Location',
          isCustomGPS: true,
        });
      },
      () => {
        setIsLocating(false);
        setUserLocation({
          lat: -25.7479,
          lng: 28.2293,
          label: 'Pretoria, Gauteng (Default)',
          isCustomGPS: false,
        });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleCityFocus = (cityName: string, lat: number, lng: number) => {
    setUserLocation({
      lat,
      lng,
      label: cityName,
      isCustomGPS: false,
    });
  };

  // Build dynamic Google Maps Embed URL for active/hovered target
  const targetLat = activePractitioner?.coordinates?.latitude || userLocation.lat;
  const targetLng = activePractitioner?.coordinates?.longitude || userLocation.lng;
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${targetLat},${targetLng}&t=${mapType}&z=${mapZoom}&ie=UTF8&iwloc=&output=embed`;

  // Direct Google Maps navigation URLs
  const drivingDirectionsUrl = activePractitioner
    ? getDirectionsUrl(userLocation.lat, userLocation.lng, targetLat, targetLng, 'driving')
    : '#';
  const walkingDirectionsUrl = activePractitioner
    ? getDirectionsUrl(userLocation.lat, userLocation.lng, targetLat, targetLng, 'walking')
    : '#';

  return (
    <div className="space-y-6">
      {/* 1. Interactive Google Map Container */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
        {/* Top Map Action Bar */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#176BFF]" /> Google Maps Live Healthcare Discovery
              </span>
              <p className="text-[11px] text-slate-400">
                Origin:{' '}
                <strong className="text-white">{userLocation.label}</strong> • {allPractitioners.length} practitioners mapped
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick city selectors */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => handleCityFocus('Pretoria / Tshwane', -25.7479, 28.2293)}
                className="px-2.5 py-1 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Pretoria
              </button>
              <button
                type="button"
                onClick={() => handleCityFocus('Johannesburg / Sandton', -26.1076, 28.0567)}
                className="px-2.5 py-1 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Johannesburg
              </button>
              <button
                type="button"
                onClick={() => handleCityFocus('Cape Town', -33.9249, 18.4241)}
                className="px-2.5 py-1 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Cape Town
              </button>
              <button
                type="button"
                onClick={() => handleCityFocus('Durban / eThekwini', -29.8587, 31.0218)}
                className="px-2.5 py-1 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Durban
              </button>
            </div>

            {/* Use My Location Button */}
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="px-3 py-1.5 rounded-xl bg-[#176BFF] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
            </button>

            {/* Map Layer Switcher */}
            <button
              type="button"
              onClick={() => setMapType(mapType === 'm' ? 'k' : 'm')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1"
              title="Toggle Satellite / Roadmap View"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>{mapType === 'm' ? 'Satellite' : 'Roadmap'}</span>
            </button>
          </div>
        </div>

        {/* Map View Canvas with Hover Destination Overlay */}
        <div className="bg-slate-100 h-[440px] relative flex flex-col">
          <iframe
            title="Google Maps South Africa Healthcare"
            src={googleMapsEmbedUrl}
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
          />

          {/* Overlay Destination Card for Hovered or Selected Practitioner */}
          {activePractitioner && (
            <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-900 truncate">
                    {activePractitioner.name}
                  </span>
                  {activePractitioner.type === 'VERIFIED' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Provider
                    </span>
                  ) : activePractitioner.type === 'EXTERNAL_UNLOCKED' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      <Compass className="w-3 h-3 text-blue-600" /> External Practice
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      <Lock className="w-3 h-3 text-amber-600" /> Locked Info
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-[#176BFF] bg-blue-50 px-2 py-0.5 rounded-md">
                    {activePractitioner.distanceKm} km away
                  </span>
                </div>

                {/* Where you are supposed to go */}
                <div className="flex items-center gap-1.5 text-xs text-slate-700 mt-1 font-medium truncate">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                  <span className="font-semibold text-slate-900">Destination:</span>
                  <span className="truncate">{activePractitioner.address}</span>
                </div>

                {/* Estimated Driving & Walking Minutes */}
                <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Car className="w-3.5 h-3.5 text-[#176BFF]" />
                    <span>{activePractitioner.travel.driveText}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Footprints className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{activePractitioner.travel.walkText}</span>
                  </span>
                  <span className="text-slate-400 font-normal">
                    (Estimated travel time from {userLocation.label.split(',')[0]})
                  </span>
                </div>
              </div>

              {/* Action Buttons: Directions on Google Maps + See Details on Platform */}
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                {/* Google Maps Driving Directions */}
                <a
                  href={drivingDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Open Google Maps Driving Directions"
                >
                  <Car className="w-3.5 h-3.5 text-[#176BFF]" />
                  <span>Drive ({activePractitioner.travel.driveMinutes} min)</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                {/* Google Maps Walking Directions */}
                <a
                  href={walkingDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Open Google Maps Walking Directions"
                >
                  <Footprints className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Walk ({activePractitioner.travel.walkMinutes} min)</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                {/* See Details on Platform */}
                {activePractitioner.type === 'VERIFIED' ? (
                  <Link to={`/providers/${activePractitioner.slug}`}>
                    <Button variant="primary" size="sm" className="font-bold text-xs">
                      <span>See details on platform</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                ) : activePractitioner.type === 'EXTERNAL_UNLOCKED' ? (
                  <Link to={`/external-practitioners/${activePractitioner.id}`}>
                    <Button variant="outline" size="sm" className="font-bold text-xs">
                      <span>See details on platform</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/pricing">
                    <Button variant="accent" size="sm" className="font-bold text-xs">
                      <span>See details on platform</span>
                      <Lock className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Practitioners Displayed Under This Map View */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-[#176BFF]" />
              <span>Practitioners on this Map</span>
              <span className="text-xs font-normal text-slate-500">
                ({allPractitioners.length} practitioners in current view)
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Hover over any practitioner to view their exact destination location on the map, estimated travel minutes by car/walking, and access details.
            </p>
          </div>

          <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            Origin: {userLocation.label}
          </div>
        </div>

        {/* List Grid of Practitioners under the map */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allPractitioners.map((practitioner) => {
            const isHovered = hoveredPractitionerId === practitioner.id;
            const isSelected = selectedPractitionerId === practitioner.id;
            const isFocused = isHovered || isSelected;

            const cardDrivingUrl = getDirectionsUrl(
              userLocation.lat,
              userLocation.lng,
              practitioner.coordinates.latitude,
              practitioner.coordinates.longitude,
              'driving'
            );
            const cardWalkingUrl = getDirectionsUrl(
              userLocation.lat,
              userLocation.lng,
              practitioner.coordinates.latitude,
              practitioner.coordinates.longitude,
              'walking'
            );

            return (
              <div
                key={practitioner.id}
                onMouseEnter={() => {
                  setHoveredPractitionerId(practitioner.id);
                  setSelectedPractitionerId(practitioner.id);
                }}
                onMouseLeave={() => {
                  setHoveredPractitionerId(null);
                }}
                className={`bg-white rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                  isFocused
                    ? 'border-[#176BFF] ring-2 ring-[#176BFF]/20 shadow-md transform -translate-y-0.5'
                    : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div>
                  {/* Top Bar: Name, Status Badge, Rating */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-extrabold text-slate-900 truncate hover:text-[#176BFF]">
                          {practitioner.name}
                        </h4>
                        {practitioner.type === 'VERIFIED' ? (
                          <Badge variant="verified" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
                            Verified
                          </Badge>
                        ) : practitioner.type === 'EXTERNAL_UNLOCKED' ? (
                          <Badge variant="slate" size="sm" icon={<Compass className="w-3 h-3" />}>
                            External
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm" icon={<Lock className="w-3 h-3" />}>
                            Locked
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs font-bold text-[#176BFF] mt-0.5">
                        {practitioner.specialty}
                      </p>

                      <div className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                        {practitioner.practice}
                      </div>
                    </div>

                    {practitioner.rating && (
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-xl border border-amber-200/80 flex-shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-amber-900">
                          {practitioner.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Destination Location Box (Shows where to go on hover/view) */}
                  <div
                    className={`mt-3 p-2.5 rounded-xl text-xs transition-colors ${
                      isFocused
                        ? 'bg-blue-50/80 border border-blue-200 text-slate-900'
                        : 'bg-slate-50 border border-slate-100 text-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-1.5">
                      <MapPin
                        className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                          isFocused ? 'text-[#176BFF]' : 'text-slate-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800">
                          {isFocused ? '📍 Location of where you are going:' : 'Practice Address:'}
                        </span>
                        <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                          {practitioner.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Travel Times & Distance (Car & Walking) */}
                  <div className="mt-3 flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-xs">
                        {practitioner.distanceKm} km
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                        <Car className="w-3.5 h-3.5 text-[#176BFF]" />
                        <span>{practitioner.travel.driveText}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                        <Footprints className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{practitioner.travel.walkText}</span>
                      </span>
                    </div>

                    {practitioner.fee ? (
                      <span className="text-xs font-black text-slate-900">
                        R{practitioner.fee}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {practitioner.type === 'EXTERNAL_LOCKED' ? 'Locked Info' : 'External Directory'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Row */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Google Maps Navigation Links */}
                  <div className="flex items-center gap-1.5">
                    <a
                      href={cardDrivingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#176BFF] hover:text-[#176BFF] text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                      title="Open Driving Directions in Google Maps"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Car className="w-3 h-3 text-[#176BFF]" />
                      <span>Drive ({practitioner.travel.driveMinutes}m)</span>
                    </a>
                    <a
                      href={cardWalkingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-600 hover:text-emerald-700 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                      title="Open Walking Directions in Google Maps"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Footprints className="w-3 h-3 text-emerald-600" />
                      <span>Walk ({practitioner.travel.walkMinutes}m)</span>
                    </a>
                  </div>

                  {/* See details on the platform */}
                  <div>
                    {practitioner.type === 'VERIFIED' ? (
                      <Link
                        to={`/providers/${practitioner.slug}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs py-1.5 px-3 font-bold"
                        >
                          <span>See details on platform</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    ) : practitioner.type === 'EXTERNAL_UNLOCKED' ? (
                      <Link
                        to={`/external-practitioners/${practitioner.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs py-1.5 px-3 font-bold"
                        >
                          <span>See details on platform</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/pricing" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="accent"
                          size="sm"
                          className="text-xs py-1.5 px-3 font-bold"
                        >
                          <span>See details on platform</span>
                          <Lock className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
