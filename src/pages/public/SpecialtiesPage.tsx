import React from 'react';
import { Link } from 'react-router-dom';
import { HEALTHCARE_SPECIALTIES } from '../../lib/constants';
import { Search, ArrowRight, Stethoscope } from 'lucide-react';

export const SpecialtiesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-black text-slate-900">
            Healthcare Specialties & Medical Disciplines
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Find doctors, specialists, therapists, and allied healthcare practitioners across South Africa categorized by professional HPCSA registration category.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {HEALTHCARE_SPECIALTIES.map((spec) => (
            <Link
              key={spec}
              to={`/find-care?q=${encodeURIComponent(spec)}`}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#176BFF] hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#176BFF] flex items-center justify-center mb-3 group-hover:bg-[#176BFF] group-hover:text-white transition-colors">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#176BFF] transition-colors">
                  {spec}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Practitioners & Clinics across SA
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#176BFF]">
                <span>Find Practitioners</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
