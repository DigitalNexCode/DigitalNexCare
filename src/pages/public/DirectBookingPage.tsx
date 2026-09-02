import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Video,
  Building,
  User,
  Star,
  CheckCircle2,
  ChevronRight,
  Phone,
  Mail,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { MOCK_PROVIDERS } from '../../data/mockDatabase';
import { DigitalNexCareProvider, AppointmentSlot } from '../../types';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { SEOHead } from '../../components/seo/SEOHead';

export const DirectBookingPage: React.FC = () => {
  const { practiceSlug, providerSlug } = useParams<{ practiceSlug: string; providerSlug?: string }>();
  const navigate = useNavigate();

  const [selectedProvider, setSelectedProvider] = useState<DigitalNexCareProvider | null>(null);
  const [practiceProviders, setPracticeProviders] = useState<DigitalNexCareProvider[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [bookingMode, setBookingMode] = useState<'IN_PERSON' | 'VIRTUAL'>('IN_PERSON');
  const [practiceName, setPracticeName] = useState<string>('');

  useEffect(() => {
    // Look up providers by practice slug or provider slug
    const normalizedPracticeSlug = practiceSlug?.toLowerCase() || '';
    const normalizedProviderSlug = providerSlug?.toLowerCase() || '';

    // Match practice
    const matched = MOCK_PROVIDERS.filter((p) => {
      const pPracticeSlug = p.practiceName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return (
        pPracticeSlug.includes(normalizedPracticeSlug) ||
        normalizedPracticeSlug.includes(pPracticeSlug) ||
        p.city.toLowerCase().includes(normalizedPracticeSlug) ||
        p.suburb.toLowerCase().includes(normalizedPracticeSlug)
      );
    });

    const activeList = matched.length > 0 ? matched : [MOCK_PROVIDERS[0]];
    setPracticeProviders(activeList);
    setPracticeName(activeList[0]?.practiceName || 'Healthcare Practice');

    if (normalizedProviderSlug) {
      const specific = MOCK_PROVIDERS.find(
        (p) => p.slug.toLowerCase() === normalizedProviderSlug || p.id === normalizedProviderSlug
      );
      if (specific) {
        setSelectedProvider(specific);
        setPracticeName(specific.practiceName);
      } else {
        setSelectedProvider(activeList[0]);
      }
    } else {
      setSelectedProvider(activeList[0]);
    }
  }, [practiceSlug, providerSlug]);

  if (!selectedProvider) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00E5D4]"></div>
      </div>
    );
  }

  const availableSlots = selectedProvider.availableSlots || [];
  const filteredSlots = availableSlots.filter(
    (s) => s.isAvailable && (bookingMode === 'ALL' || s.mode === bookingMode)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <SEOHead
        title={`Book Appointment — ${selectedProvider.fullName} | ${selectedProvider.practiceName}`}
        description={`Direct online healthcare appointment booking with ${selectedProvider.fullName} (${selectedProvider.specialty}) at ${selectedProvider.practiceName}. Instant confirmation.`}
        canonicalUrl={`https://digitalnexcare.co.za/b/${practiceSlug}${providerSlug ? `/${providerSlug}` : ''}`}
      />

      {/* Top Practice Branding Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="shrink-0 hover:opacity-80 transition">
              <BrandLogo size="sm" variant="dark" />
            </Link>
            <div className="h-5 w-px bg-slate-700 mx-1 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#00E5D4]" />
              <span className="text-sm font-bold text-white truncate max-w-xs">{practiceName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Direct Booking
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        {/* Practice Practitioner Selector (if multiple exist) */}
        {practiceProviders.length > 1 && (
          <div className="mb-8 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Select Practitioner at this Practice
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {practiceProviders.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProvider(p);
                    setSelectedSlot(null);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                    selectedProvider.id === p.id
                      ? 'bg-[#176BFF]/15 border-[#176BFF] text-white shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <img
                    src={p.photoUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80'}
                    alt={p.fullName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">{p.fullName}</p>
                    <p className="text-xs text-[#00E5D4] truncate">{p.specialty}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Provider Overview Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <img
                    src={
                      selectedProvider.photoUrl ||
                      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={selectedProvider.fullName}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-[#176BFF] shadow-lg"
                  />
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-[#00E5D4] text-slate-950 font-extrabold text-[10px] shadow">
                    HPCSA VERIFIED
                  </span>
                </div>
                <h1 className="text-xl font-black text-white">{selectedProvider.fullName}</h1>
                <p className="text-xs font-bold text-[#00E5D4] mt-0.5">{selectedProvider.specialty}</p>
                <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{selectedProvider.rating || 4.9}</span>
                  <span className="text-slate-500">({selectedProvider.reviewCount || 40}+ verified reviews)</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{selectedProvider.address}</span>
                </div>
                {selectedProvider.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{selectedProvider.phone}</span>
                  </div>
                )}
                {selectedProvider.email && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{selectedProvider.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Consultation Fee: <strong>R{selectedProvider.consultationFeeZAR || 650}</strong></span>
                </div>
              </div>

              {selectedProvider.acceptedMedicalAids && selectedProvider.acceptedMedicalAids.length > 0 && (
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Accepted Medical Schemes
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProvider.acceptedMedicalAids.map((aid) => (
                      <span
                        key={aid}
                        className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700"
                      >
                        {aid}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Slot Selection & Booking Action */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#00E5D4]" />
                  Choose an Appointment Slot
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Real-time direct availability. Guaranteed confirmation with zero booking fees.
                </p>
              </div>

              {/* Consultation Mode Selector */}
              <div className="flex gap-3 p-1.5 rounded-xl bg-slate-950 border border-slate-800 max-w-sm">
                <button
                  onClick={() => setBookingMode('IN_PERSON')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    bookingMode === 'IN_PERSON'
                      ? 'bg-[#176BFF] text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  In-Person Visit
                </button>
                <button
                  onClick={() => setBookingMode('VIRTUAL')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    bookingMode === 'VIRTUAL'
                      ? 'bg-[#00E5D4] text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  Virtual Video Call
                </button>
              </div>

              {/* Available Slots Grid */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Upcoming Real-Time Openings
                </p>
                {filteredSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filteredSlots.map((slot) => {
                      const isSelected = selectedSlot?.id === slot.id;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-gradient-to-br from-[#176BFF] to-[#00E5D4] text-slate-950 font-black border-transparent shadow-lg scale-105'
                              : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-[#00E5D4] hover:text-white'
                          }`}
                        >
                          <span className="text-[11px] opacity-80">{slot.date}</span>
                          <span className="text-sm font-extrabold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {slot.startTime}
                          </span>
                          <span className="text-[10px] uppercase font-bold opacity-75">
                            {slot.mode === 'IN_PERSON' ? 'In-Person' : 'Virtual'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                    <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-300">No {bookingMode.toLowerCase()} slots available today</p>
                    <p className="text-xs text-slate-500">
                      Please check the alternate mode or contact the practice directly at {selectedProvider.phone}.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  {selectedSlot ? (
                    <div>
                      <p className="text-xs text-[#00E5D4] font-bold">Selected Slot:</p>
                      <p className="text-sm font-extrabold text-white">
                        {selectedSlot.date} at {selectedSlot.startTime} ({selectedSlot.mode})
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Please select a time slot above to proceed.</p>
                  )}
                </div>

                <button
                  disabled={!selectedSlot}
                  onClick={() => {
                    navigate(`/book/${selectedProvider.id}?date=${selectedSlot?.date}&time=${selectedSlot?.startTime}&mode=${selectedSlot?.mode}`);
                  }}
                  className={`px-8 py-3.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-xl transition ${
                    selectedSlot
                      ? 'bg-gradient-to-r from-[#176BFF] to-[#00E5D4] text-slate-900 hover:opacity-95 cursor-pointer active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <span>Continue to Instant Booking</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
