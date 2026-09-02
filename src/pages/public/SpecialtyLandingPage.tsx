import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Stethoscope,
  MapPin,
  Calendar,
  ShieldCheck,
  Search,
  Star,
  ArrowRight,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { MOCK_PROVIDERS } from '../../data/mockDatabase';
import { SEOHead } from '../../components/seo/SEOHead';
import { SynonymService } from '../../lib/search/synonyms';

export const SpecialtyLandingPage: React.FC = () => {
  const { specialtySlug } = useParams<{ specialtySlug: string }>();

  // Format slug to readable name
  const formattedSpecialty = specialtySlug
    ? specialtySlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : 'General Practitioner';

  const synonymInfo = SynonymService.resolveQuery(formattedSpecialty);

  // Filter matching providers
  const matchingProviders = MOCK_PROVIDERS.filter((p) =>
    p.specialty.toLowerCase().includes(formattedSpecialty.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title={`Find Top ${formattedSpecialty}s in South Africa | Instant Booking`}
        description={`Compare verified HPCSA-registered ${formattedSpecialty}s across South Africa. Check medical aid compatibility, real-time appointment availability, and book online instantly.`}
        canonicalUrl={`https://digitalnexcare.co.za/specialties/${specialtySlug}`}
      />

      <div className="max-w-7xl mx-auto space-y-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-slate-400">
          <Link to="/" className="hover:text-white">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/search" className="hover:text-white">Specialties</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#00E5D4] font-semibold">{formattedSpecialty}</span>
        </nav>

        {/* Hero Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-[#176BFF]/20 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#176BFF]/10 text-[#00E5D4] text-xs font-bold border border-[#176BFF]/20">
              <Stethoscope className="w-4 h-4" />
              <span>South Africa Healthcare Specialty Guide</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Top Verified {formattedSpecialty}s
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {synonymInfo?.navigationExplanation ||
                `Browse verified ${formattedSpecialty} practices in South Africa. View credentials, patient ratings, consultation fees, and book direct real-time appointments.`}
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to={`/search?specialty=${encodeURIComponent(formattedSpecialty)}`}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#176BFF] to-[#00E5D4] text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:opacity-95 transition"
              >
                <Search className="w-4 h-4" />
                <span>Search All {formattedSpecialty}s Near You</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Subspecialties & Common Services */}
        {synonymInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="font-bold text-white text-sm mb-3">Sub-Specialties & Focus Areas</h3>
              <div className="flex flex-wrap gap-2">
                {synonymInfo.subSpecialties.map((sub) => (
                  <span
                    key={sub}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 text-slate-300 text-xs border border-slate-800"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="font-bold text-white text-sm mb-3">Common Services Provided</h3>
              <div className="flex flex-wrap gap-2">
                {synonymInfo.suggestedServices.map((srv) => (
                  <span
                    key={srv}
                    className="px-3 py-1.5 rounded-lg bg-[#176BFF]/10 text-[#00E5D4] text-xs border border-[#176BFF]/20"
                  >
                    {srv}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Featured Practitioners */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              Featured {formattedSpecialty}s with Online Booking
            </h2>
            <Link
              to={`/search?specialty=${encodeURIComponent(formattedSpecialty)}`}
              className="text-xs font-bold text-[#00E5D4] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(matchingProviders.length > 0 ? matchingProviders : MOCK_PROVIDERS.slice(0, 3)).map((p) => (
              <div
                key={p.id}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={p.photoUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80'}
                      alt={p.fullName}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{p.fullName}</h3>
                      <p className="text-xs text-[#00E5D4] font-medium mt-0.5">{p.specialty}</p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {p.suburb}, {p.city}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                      {p.rating}
                    </div>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300 font-medium">R{p.consultationFeeZAR} consultation</span>
                  </div>
                </div>

                <Link
                  to={`/doctors/${p.slug}`}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-[#176BFF] text-white font-bold text-xs text-center transition block"
                >
                  View Profile & Book
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
