import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_PROVIDERS } from '../../data/mockDatabase';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  ShieldCheck,
  Star,
  MapPin,
  Calendar,
  Clock,
  Video,
  Building,
  CheckCircle2,
  Award,
  CreditCard,
  Phone,
  Mail,
  ChevronRight,
} from 'lucide-react';

export const ProviderDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const provider = MOCK_PROVIDERS.find((p) => p.slug === slug) || MOCK_PROVIDERS[0];

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Main Profile Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <img
              src={provider.photoUrl}
              alt={provider.fullName}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-slate-100 shadow-sm"
              referrerPolicy="no-referrer"
            />

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {provider.fullName}
                </h1>
                <Badge variant="verified" size="md" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                  HPCSA Verified
                </Badge>
              </div>

              <p className="text-base font-bold text-[#176BFF] mt-1">{provider.specialty}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {provider.practiceName}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {provider.address}, {provider.suburb}, {provider.city}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold text-amber-900">{provider.rating.toFixed(1)}</span>
                  <span className="text-xs text-slate-500">({provider.reviewCount} reviews)</span>
                </div>

                <div className="text-xs text-slate-600">
                  HPCSA Registration: <strong className="text-slate-900">{provider.hpcsaNumber}</strong>
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-2 pt-4 md:pt-0 border-t md:border-none border-slate-100">
              <div className="text-xs text-slate-500">Consultation Fee</div>
              <div className="text-3xl font-black text-slate-900">R{provider.consultationFeeZAR}</div>
              <Link to={`/book/${provider.id}`} className="w-full md:w-auto">
                <Button variant="primary" size="lg" className="w-full" rightIcon={<ChevronRight className="w-4 h-4" />}>
                  Book Appointment
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bio, Real Slots & Medical Aid Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Bio & Services */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">About the Practitioner</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{provider.bio}</p>

              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-3">
                Clinical Services Offered
              </h3>
              <div className="flex flex-wrap gap-2">
                {(provider.services || (provider as any).servicesOffered || []).map((s: string, idx: number) => (
                  <span
                    key={idx}
                    className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Accepted Medical Aids</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(provider.acceptedMedicalAids || []).map((aid) => (
                  <div
                    key={aid}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{aid}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Real Availability Slots */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#176BFF]" />
                  Available Time Slots
                </h3>
                <span className="text-[11px] font-bold text-emerald-600">Free Booking</span>
              </div>

              <div className="space-y-2">
                {(provider.availableSlots || []).map((slot) => (
                  <Link
                    key={slot.id}
                    to={`/book/${provider.id}?slot=${slot.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#176BFF] hover:bg-blue-50/50 transition-all text-xs group"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{slot.date}</div>
                      <div className="text-slate-500">{slot.startTime} - {slot.endTime}</div>
                    </div>
                    <Button variant="primary" size="sm">
                      Select
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
