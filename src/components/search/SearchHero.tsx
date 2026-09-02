import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import {
  Search,
  MapPin,
  Shield,
  LocateFixed,
  ChevronDown,
} from 'lucide-react';
import { HEALTHCARE_SPECIALTIES, SA_MEDICAL_AIDS } from '../../lib/constants';

interface SearchHeroProps {
  initialQuery?: string;
  initialLocation?: string;
  initialMedicalAid?: string;
  onSearch?: (query: string, location: string, medicalAid: string) => void;
}

const HERO_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=1920',
    alt: 'Healthcare consultation with caring doctor in modern clinic',
  },
  {
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1920',
    alt: 'Digital healthcare practitioner reviewing patient records and telemedicine',
  },
  {
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=1920',
    alt: 'Healthcare specialist team collaborating in modern medical practice',
  },
];

export const SearchHero: React.FC<SearchHeroProps> = ({
  initialQuery = '',
  initialLocation = '',
  initialMedicalAid = '',
  onSearch,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [medicalAid, setMedicalAid] = useState(initialMedicalAid);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Background slideshow interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        setLocation(`Near Me (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`);
      },
      () => {
        setIsLocating(false);
        setGeoError('Location permission denied or unavailable. Please type your city or suburb.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query, location, medicalAid);
    } else {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (location) params.set('loc', location);
      if (medicalAid) params.set('aid', medicalAid);
      navigate(`/find-care?${params.toString()}`);
    }
  };

  return (
    <div className="relative bg-[#07111F] text-white pt-14 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[500px] flex items-center justify-center">
      {/* Background Image Slideshow with smooth fade transitions */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.url}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.url}
              alt={slide.alt}
              className="w-full h-full object-cover object-center transform scale-105"
              referrerPolicy="no-referrer"
            />
          </div>
        ))}
        {/* Solid high-contrast dark overlay for optimal typography legibility */}
        <div className="absolute inset-0 bg-[#07111F]/85" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center w-full">
        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
          Find the right care.{' '}
          <span className="text-[#00E5D4]">
            Right when you need it.
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed font-normal">
          Search thousands of verified General Practitioners, Dentists, Specialists, and Allied Healthcare professionals across all 9 provinces.
        </p>

        {/* Main Search Bar Card */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-2xl border border-slate-700/40 text-left"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-2">
            {/* Input 1: What care do you need? */}
            <div className="flex flex-col px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100 md:border-none">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#176BFF]" />
                What care do you need?
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Doctor, Dentist, GP, Specialist..."
                list="specialty-suggestions"
                className="w-full text-sm font-semibold text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
              />
              <datalist id="specialty-suggestions">
                {HEALTHCARE_SPECIALTIES.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            {/* Input 2: Location + Use My Location button */}
            <div className="flex flex-col px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100 md:border-none md:border-l md:border-slate-200">
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#00E5D4]" />
                  Location
                </label>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={isLocating}
                  className="text-[11px] font-bold text-[#176BFF] hover:text-[#0E5CE6] flex items-center gap-1 cursor-pointer"
                >
                  <LocateFixed className="w-3 h-3" />
                  {isLocating ? 'Locating...' : 'USE MY LOCATION'}
                </button>
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Suburb, City, or Province (e.g. Pretoria, Sandton)"
                className="w-full text-sm font-semibold text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
              />
            </div>

            {/* Input 3: Medical Aid */}
            <div className="flex flex-col px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100 md:border-none md:border-l md:border-slate-200">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                Medical Aid Scheme
              </label>
              <select
                value={medicalAid}
                onChange={(e) => setMedicalAid(e.target.value)}
                className="w-full text-sm font-semibold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="">Any Medical Aid / Private</option>
                {SA_MEDICAL_AIDS.map((aid) => (
                  <option key={aid} value={aid}>
                    {aid}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Database-first live index • Free direct booking for verified providers</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto px-8 font-extrabold uppercase tracking-wide text-xs"
              leftIcon={<Search className="w-4 h-4" />}
            >
              SEARCH HEALTHCARE
            </Button>
          </div>
        </form>

        {/* Slideshow Progress Indicators */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-6 bg-[#00E5D4]' : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {geoError && (
          <p className="mt-2 text-xs text-amber-300 font-medium">{geoError}</p>
        )}
      </div>
    </div>
  );
};
