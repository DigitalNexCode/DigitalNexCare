import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SA_PROVINCES, SA_CITIES_BY_PROVINCE } from '../../lib/constants';
import { MapPin, ArrowRight, Building, Compass } from 'lucide-react';

export const LocationsPage: React.FC = () => {
  const [selectedProvince, setSelectedProvince] = useState<string>(SA_PROVINCES[0]);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-black text-slate-900">
            Browse Healthcare by Location
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            DigitalNexCare indexes practitioners across all 9 provinces, key metropolitan areas, regional towns, and local suburbs.
          </p>
        </div>

        {/* 9 Provinces Selector Tabs */}
        <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200">
          {SA_PROVINCES.map((prov) => (
            <button
              key={prov}
              onClick={() => setSelectedProvince(prov)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedProvince === prov
                  ? 'bg-[#176BFF] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {prov}
            </button>
          ))}
        </div>

        {/* Selected Province Details & Cities */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#176BFF]">
                <MapPin className="w-4 h-4" /> Selected Province
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{selectedProvince}</h2>
            </div>
            <Link to={`/find-care?province=${encodeURIComponent(selectedProvince)}`}>
              <button className="text-xs font-bold text-[#176BFF] hover:underline flex items-center gap-1">
                View all in {selectedProvince} →
              </button>
            </Link>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Cities, Towns & Regional Metros
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {(SA_CITIES_BY_PROVINCE[selectedProvince as keyof typeof SA_CITIES_BY_PROVINCE] || []).map(
                (city) => (
                  <Link
                    key={city}
                    to={`/find-care?province=${encodeURIComponent(
                      selectedProvince
                    )}&city=${encodeURIComponent(city)}`}
                    className="p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 rounded-xl transition-all text-left group"
                  >
                    <div className="text-xs font-bold text-slate-800 group-hover:text-[#176BFF] transition-colors">
                      {city}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Find care →</div>
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
