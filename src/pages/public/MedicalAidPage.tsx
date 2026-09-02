import React from 'react';
import { Link } from 'react-router-dom';
import { SA_MEDICAL_AIDS } from '../../lib/constants';
import { Shield, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const MedicalAidPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3 border border-emerald-200">
            <Shield className="w-3.5 h-3.5" />
            <span>South African Medical Scheme Compatibility</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">
            Find Practitioners by Medical Aid
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Search healthcare providers who accept your specific medical aid scheme, including Discovery Health, GEMS, Bonitas, Medihelp, and Momentum.
          </p>
        </div>

        {/* Disclaimer Banner */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Important Medical Aid Notice:</strong> Medical aid acceptance information on DigitalNexCare reflects provider-declared compatibility and network participation. Always confirm specific benefit option authorizations and co-payments with your medical scheme prior to consultation.
          </p>
        </div>

        {/* Schemes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SA_MEDICAL_AIDS.map((scheme) => (
            <div
              key={scheme}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#176BFF] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#176BFF] flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{scheme}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Practitioners accepting {scheme} members
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Direct claim support
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  to={`/find-care?aid=${encodeURIComponent(scheme)}`}
                  className="text-xs font-bold text-[#176BFF] hover:underline flex items-center justify-between"
                >
                  <span>Search {scheme} Providers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
