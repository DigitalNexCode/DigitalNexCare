import React, { useState, useEffect, useMemo } from 'react';
import { ProviderCard } from '../../components/provider/ProviderCard';
import { UnlockedExternalCard } from '../../components/external-practitioner/UnlockedExternalCard';
import { LockedExternalCard } from '../../components/external-practitioner/LockedExternalCard';
import { MOCK_PROVIDERS, MOCK_UNLOCKED_EXTERNAL, MOCK_LOCKED_EXTERNAL } from '../../data/mockDatabase';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../lib/auth/context';
import { calculateDistanceKm } from '../../lib/subscription/subscription-service';
import { LocateFixed, MapPin, Navigation, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

export const NearMePage: React.FC = () => {
  const { unlockedIds } = useAuth();
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'LOCATING' | 'GRANTED' | 'DENIED'>('IDLE');
  const [radiusKm, setRadiusKm] = useState(15);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus('DENIED');
      // Fallback coordinate in Pretoria East
      setCoordinates({ lat: -25.7545, lng: 28.2314 });
      return;
    }
    setStatus('LOCATING');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('GRANTED');
      },
      (err) => {
        setStatus('DENIED');
        setCoordinates({ lat: -25.7545, lng: 28.2314 });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const nearbyProviders = useMemo(() => {
    const lat = coordinates?.lat || -25.7545;
    const lng = coordinates?.lng || 28.2314;

    return MOCK_PROVIDERS.map((p) => {
      const dist = p.coordinates
        ? calculateDistanceKm(lat, lng, p.coordinates.latitude, p.coordinates.longitude)
        : 3.8;
      return { ...p, calculatedDistance: dist };
    }).filter((p) => p.calculatedDistance <= radiusKm);
  }, [coordinates, radiusKm]);

  const nearbyUnlocked = useMemo(() => {
    const lat = coordinates?.lat || -25.7545;
    const lng = coordinates?.lng || 28.2314;

    return MOCK_UNLOCKED_EXTERNAL.filter((p) => unlockedIds.includes(p.id)).map((p) => {
      const dist = p.coordinates
        ? calculateDistanceKm(lat, lng, p.coordinates.latitude, p.coordinates.longitude)
        : 4.5;
      return { ...p, calculatedDistance: dist };
    }).filter((p) => p.calculatedDistance <= radiusKm);
  }, [coordinates, radiusKm, unlockedIds]);

  const nearbyLocked = useMemo(() => {
    return MOCK_LOCKED_EXTERNAL.filter((p) => !unlockedIds.includes(p.id)).map((p) => {
      const dist = p.approximateDistanceKm || 5.2;
      return { ...p, calculatedDistance: dist };
    }).filter((p) => p.calculatedDistance <= radiusKm);
  }, [radiusKm, unlockedIds]);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="bg-[#07111F] text-white rounded-3xl p-8 sm:p-10 relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-[#00E5D4] mb-3">
              <LocateFixed className="w-3.5 h-3.5" />
              <span>Precise Geolocation Discovery</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
              Healthcare Practitioners Near You
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Discover verified doctors, dentists, clinics, and allied health professionals situated closest to your current position.
            </p>

            {/* Geolocation Trigger / Status */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button
                variant="accent"
                size="md"
                onClick={requestLocation}
                isLoading={status === 'LOCATING'}
                leftIcon={<LocateFixed className="w-4 h-4" />}
              >
                {status === 'GRANTED' ? 'Refresh Current Location' : 'Detect My Location'}
              </Button>

              {coordinates && (
                <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>
                    Lat: {coordinates.lat.toFixed(4)}, Lng: {coordinates.lng.toFixed(4)} (Gauteng Metro)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {status === 'DENIED' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <strong className="block font-bold">Location Permission Denied:</strong>
              We cannot detect your GPS location directly. Showing practitioners in South Africa's primary metropolitan areas (Gauteng default). You can also search by suburb or city on the Find Care page.
            </div>
          </div>
        )}

        {/* Radius Filter Bar (Chunk 5: 5km, 10km, 15km, 25km, 50km) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 gap-3">
          <span className="text-xs font-bold text-slate-800">
            Search Radius: <span className="text-[#176BFF]">{radiusKm} km</span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[5, 10, 15, 25, 50].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadiusKm(r)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  radiusKm === r
                    ? 'bg-[#176BFF] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Closest Verified Providers & Healthcare Practices ({nearbyProviders.length + nearbyUnlocked.length + nearbyLocked.length} matches within {radiusKm} km)
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {nearbyProviders.map((p) => (
              <ProviderCard key={p.id} provider={p} userDistanceKm={p.calculatedDistance} />
            ))}
            {nearbyUnlocked.map((p) => (
              <UnlockedExternalCard key={p.id} practitioner={p} />
            ))}
            {nearbyLocked.map((p) => (
              <LockedExternalCard
                key={p.id}
                practitioner={p}
                userDistanceKm={p.calculatedDistance}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
