import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Stethoscope,
  Calendar,
  ShieldCheck,
  Search,
  Star,
  ArrowRight,
  ChevronRight,
  Navigation,
} from 'lucide-react';
import { MOCK_PROVIDERS } from '../../data/mockDatabase';
import { SEOHead } from '../../components/seo/SEOHead';

export const LocationLandingPage: React.FC = () => {
  const { provinceSlug, citySlug } = useParams<{ provinceSlug: string; citySlug: string }>();

  const formatName = (slug?: string) =>
    slug
      ? slug
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : '';

  const formattedCity = formatName(citySlug) || 'Pretoria';
  const formattedProvince = formatName(provinceSlug) || 'Gauteng';

  const locationProviders = MOCK_PROVIDERS.filter((p) => {
    const pCity = p.city.toLowerCase();
    const pProv = p.province.toLowerCase();
    return pCity.includes(formattedCity.toLowerCase()) || pProv.includes(formattedProvince.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title={`Find Doctors & Healthcare Practitioners in ${formattedCity}, ${formattedProvince} | DigitalNexCare`}
        description={`Discover verified General Practitioners, Dentists, Specialists, and Allied Healthcare in ${formattedCity}, ${formattedProvince}. Real-time appointment scheduling with South African healthcare practices.`}
        canonicalUrl={`https://digitalnexcare.co.za/locations/${provinceSlug}/${citySlug}`}
      />

      <div className="max-w-7xl mx-auto space-y-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-slate-400">
          <Link to="/" className="hover:text-white">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/search" className="hover:text-white">Locations</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-300">{formattedProvince}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#00E5D4] font-semibold">{formattedCity}</span>
        </nav>

        {/* Hero Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-[#00E5D4]/15 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E5D4]/10 text-[#00E5D4] text-xs font-bold border border-[#00E5D4]/20">
              <MapPin className="w-4 h-4" />
              <span>South Africa Regional Healthcare Directory</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Healthcare in {formattedCity}, {formattedProvince}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Find and book trusted doctors, dental surgeons, physiotherapists, and medical clinics in {formattedCity}.
              Compare verified credentials, accepted medical schemes, and open calendar slots.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to={`/search?city=${encodeURIComponent(formattedCity)}&province=${encodeURIComponent(formattedProvince)}`}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#176BFF] to-[#00E5D4] text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:opacity-95 transition"
              >
                <Search className="w-4 h-4" />
                <span>Search All Practitioners in {formattedCity}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Suburbs / Regional Hubs */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h3 className="font-bold text-white text-sm mb-3">Popular Suburbs in {formattedCity}</h3>
          <div className="flex flex-wrap gap-2">
            {['Hatfield', 'Menlyn', 'Pretoria East', 'Brooklyn', 'Centurion', 'Arcadia', 'Garsfontein', 'Faerie Glen'].map((sub) => (
              <Link
                key={sub}
                to={`/search?suburb=${encodeURIComponent(sub)}&city=${encodeURIComponent(formattedCity)}`}
                className="px-3 py-1.5 rounded-lg bg-slate-950 text-slate-300 text-xs border border-slate-800 hover:border-[#00E5D4] transition"
              >
                {sub}
              </Link>
            ))}
          </div>
        </div>

        {/* Local Practitioners */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              Practitioners in {formattedCity}
            </h2>
            <Link
              to={`/search?city=${encodeURIComponent(formattedCity)}`}
              className="text-xs font-bold text-[#00E5D4] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(locationProviders.length > 0 ? locationProviders : MOCK_PROVIDERS).map((p) => (
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
