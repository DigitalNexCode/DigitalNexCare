import React from 'react';
import { Link } from 'react-router-dom';
import { SearchHero } from '../../components/search/SearchHero';
import { ProviderCard } from '../../components/provider/ProviderCard';
import { UnlockedExternalCard } from '../../components/external-practitioner/UnlockedExternalCard';
import { LockedExternalCard } from '../../components/external-practitioner/LockedExternalCard';
import { PricingTable } from '../../components/subscription/PricingTable';
import { MOCK_PROVIDERS, MOCK_UNLOCKED_EXTERNAL, MOCK_LOCKED_EXTERNAL } from '../../data/mockDatabase';
import { HEALTHCARE_SPECIALTIES, SA_PROVINCES } from '../../lib/constants';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  ShieldCheck,
  Calendar,
  Search,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  HeartHandshake,
  Building2,
  Users,
  Compass,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* 1. Search Hero Section */}
      <SearchHero />

      {/* 2. Platform Value Props (Trust & Model Clarity) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#176BFF] flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">HPCSA Verified Providers</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Every joined practitioner undergoes strict identity, HPCSA/SANC registration, and practice verification before publishing live booking slots.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">100% Free Direct Booking</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Patients never pay a subscription fee to find and book appointments with verified DigitalNexCare providers. Real-time availability guaranteed.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">National Healthcare Index</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Discover both joined providers and licensed external practitioners across all 9 provinces with transparent subscription reveal quotas.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Featured Verified Providers (Bookable Now) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="verified" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                DigitalNexCare Verified
              </Badge>
              <span className="text-xs font-semibold text-emerald-700">Instant Online Booking</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Verified Providers Ready for Consultations
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select an available time slot below to reserve your appointment in seconds.
            </p>
          </div>

          <Link to="/find-care?verified=true">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All Verified
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {MOCK_PROVIDERS.slice(0, 2).map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      </section>

      {/* 4. Practitioner Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#07111F] text-white p-8 sm:p-12 border border-slate-800">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              Understanding DigitalNexCare's Practitioner Categories
            </h2>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              We provide access to healthcare in South Africa by indexing two distinct practitioner categories:
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <h3 className="text-lg font-bold text-white">1. DigitalNexCare Provider</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Practitioners who have claimed their profile, completed HPCSA verification, and enabled real-time appointment scheduling.
              </p>
              <ul className="text-xs space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> Free direct appointment booking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> Verified consultation fees & medical aids
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> In-person & virtual telehealth slots
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-400" />
                <h3 className="text-lg font-bold text-white">2. External Practitioner</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Practitioners indexed from approved public registers and professional bodies who have not yet joined scheduling.
              </p>
              <ul className="text-xs space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /> Governed by monthly reveal quota (2 Free reveals)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /> Direct phone, directions & website access
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /> No fake availability or simulated bookings
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. External Discovery Preview (List Format) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="slate" size="sm">
                External National Index
              </Badge>
              <span className="text-xs text-slate-500">Public Practice Registers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              External Practitioner Directory
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              South Africans receive 2 free reveals every month to unlock external practitioner contact details.
            </p>
          </div>

          <Link to="/find-care">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Search All Practitioners
            </Button>
          </Link>
        </div>

        <div className="flex flex-col space-y-4">
          <UnlockedExternalCard practitioner={MOCK_UNLOCKED_EXTERNAL[0]} />
          <LockedExternalCard practitioner={MOCK_LOCKED_EXTERNAL[0]} />
        </div>
      </section>

      {/* 6. Popular Healthcare Specialties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Browse by Healthcare Specialty
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access general medicine, specialized healthcare, mental wellness, and allied therapy professionals.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {HEALTHCARE_SPECIALTIES.slice(0, 12).map((specialty) => (
            <Link
              key={specialty}
              to={`/find-care?q=${encodeURIComponent(specialty)}`}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#176BFF] hover:bg-blue-50/40 text-center transition-all group"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-[#176BFF] transition-colors line-clamp-2">
                {specialty}
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-6">
          <Link to="/specialties">
            <Button variant="outline" size="sm">
              View All 24+ Specialties
            </Button>
          </Link>
        </div>
      </section>

      {/* 7. National Coverage across All 9 Provinces */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100 rounded-3xl p-8 sm:p-10 border border-slate-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Healthcare Coverage in All 9 Provinces
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                From major metros (Johannesburg, Cape Town, Durban, Pretoria) to regional towns and townships.
              </p>
            </div>
            <Link to="/locations">
              <Button variant="secondary" size="sm">
                Explore All Towns & Cities
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
            {SA_PROVINCES.map((prov) => (
              <Link
                key={prov}
                to={`/find-care?province=${encodeURIComponent(prov)}`}
                className="p-3 bg-white rounded-xl border border-slate-200 hover:border-[#176BFF] text-center transition-all"
              >
                <div className="text-xs font-bold text-slate-800 truncate">{prov}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Explore →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Patient Subscription Plans */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-4">
          <Badge variant="brand" size="sm">
            Simple, Transparent Pricing
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            Patient Plans for Every Household
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enjoy free booking on DigitalNexCare providers, plus monthly reveal allowances for our national external practitioner directory.
          </p>
        </div>

        <PricingTable />
      </section>

      {/* 9. Provider Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-[#07111F] rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-800 shadow-xl">
          <div className="space-y-3 max-w-xl">
            <Badge variant="success" size="sm">
              Healthcare Providers & Practices
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Are You a Healthcare Practitioner in South Africa?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Claim your existing practice profile, complete verification, and offer instant digital bookings to thousands of patients looking for care today.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-shrink-0">
            <Link to="/provider/find-existing" className="w-full sm:w-auto">
              <Button variant="accent" size="lg" className="w-full">
                Claim My Profile
              </Button>
            </Link>
            <Link to="/for-providers" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full bg-white/10 text-white border-white/20 hover:bg-white/20">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
