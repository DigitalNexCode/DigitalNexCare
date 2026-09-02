import React from 'react';
import { SearchFilterState } from '../../types';
import { SA_PROVINCES, SA_CITIES_BY_PROVINCE, HEALTHCARE_SPECIALTIES, SA_MEDICAL_AIDS } from '../../lib/constants';
import { Filter, RotateCcw, Check, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface SearchFiltersProps {
  filters: SearchFilterState;
  onChange: (newFilters: SearchFilterState) => void;
  onReset: () => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onChange,
  onReset,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const handleProvinceChange = (province: string) => {
    onChange({
      ...filters,
      province,
      city: '', // reset city when province changes
    });
  };

  const availableCities = filters.province
    ? SA_CITIES_BY_PROVINCE[filters.province as keyof typeof SA_CITIES_BY_PROVINCE] || []
    : [];

  return (
    <div className={`space-y-6 ${isMobileDrawer ? 'p-4' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#176BFF]" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Refine Search
          </h3>
        </div>
        <button
          onClick={onReset}
          className="text-xs font-semibold text-slate-500 hover:text-[#FF3D71] flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Specialty Filter */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
          Specialty / Profession
        </label>
        <select
          value={filters.specialty}
          onChange={(e) => onChange({ ...filters, specialty: e.target.value })}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#176BFF] focus:outline-none"
        >
          <option value="">All Specialties</option>
          {HEALTHCARE_SPECIALTIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Province Filter */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
          Province (South Africa)
        </label>
        <select
          value={filters.province}
          onChange={(e) => handleProvinceChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#176BFF] focus:outline-none"
        >
          <option value="">All 9 Provinces</option>
          {SA_PROVINCES.map((prov) => (
            <option key={prov} value={prov}>
              {prov}
            </option>
          ))}
        </select>
      </div>

      {/* City / Town Filter */}
      {filters.province && (
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
            City / Town
          </label>
          <select
            value={filters.city}
            onChange={(e) => onChange({ ...filters, city: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#176BFF] focus:outline-none"
          >
            <option value="">All Cities in {filters.province}</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Suburb text search */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
          Suburb
        </label>
        <input
          type="text"
          value={filters.suburb}
          onChange={(e) => onChange({ ...filters, suburb: e.target.value })}
          placeholder="e.g. Hatfield, Sea Point, Sandton..."
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#176BFF] focus:outline-none"
        />
      </div>

      {/* Medical Aid Filter */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
          Accepted Medical Aid
        </label>
        <select
          value={filters.medicalAid}
          onChange={(e) => onChange({ ...filters, medicalAid: e.target.value })}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#176BFF] focus:outline-none"
        >
          <option value="">All Medical Schemes</option>
          {SA_MEDICAL_AIDS.map((aid) => (
            <option key={aid} value={aid}>
              {aid}
            </option>
          ))}
        </select>
      </div>

      {/* Consultation Mode */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
          Consultation Mode
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
          {(['ALL', 'IN_PERSON', 'VIRTUAL'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChange({ ...filters, mode: m })}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filters.mode === m
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m === 'ALL' ? 'Any' : m === 'IN_PERSON' ? 'In-person' : 'Virtual'}
            </button>
          ))}
        </div>
      </div>

      {/* Verified Only Checkbox */}
      <div className="space-y-3 pt-2">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => onChange({ ...filters, verifiedOnly: e.target.checked })}
            className="w-4 h-4 rounded text-[#176BFF] focus:ring-[#176BFF] border-slate-300"
          />
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00E5D4]" /> DigitalNexCare Verified Providers only
          </span>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.availableToday}
            onChange={(e) => onChange({ ...filters, availableToday: e.target.checked })}
            className="w-4 h-4 rounded text-[#176BFF] focus:ring-[#176BFF] border-slate-300"
          />
          <span className="text-xs font-semibold text-slate-800">
            Available Today / Tomorrow
          </span>
        </label>
      </div>

      {/* Language */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
          Language Spoken
        </label>
        <select
          value={filters.language}
          onChange={(e) => onChange({ ...filters, language: e.target.value })}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#176BFF] focus:outline-none"
        >
          <option value="">Any Language</option>
          <option value="English">English</option>
          <option value="isiZulu">isiZulu</option>
          <option value="isiXhosa">isiXhosa</option>
          <option value="Afrikaans">Afrikaans</option>
          <option value="Setswana">Setswana</option>
          <option value="Sesotho">Sesotho</option>
        </select>
      </div>

      {/* Gender Preference */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
          Gender Preference
        </label>
        <select
          value={filters.gender}
          onChange={(e) => onChange({ ...filters, gender: e.target.value })}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#176BFF] focus:outline-none"
        >
          <option value="">No Preference</option>
          <option value="FEMALE">Female Practitioner</option>
          <option value="MALE">Male Practitioner</option>
        </select>
      </div>

      {isMobileDrawer && (
        <div className="pt-4 border-t border-slate-200">
          <Button variant="primary" className="w-full" onClick={onCloseMobileDrawer}>
            Apply Filters
          </Button>
        </div>
      )}
    </div>
  );
};
