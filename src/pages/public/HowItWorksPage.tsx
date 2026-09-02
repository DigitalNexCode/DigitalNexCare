import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Search,
  Calendar,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Building,
  ArrowRight,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 space-y-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="brand" size="sm">
            DigitalNexCare Guide
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mt-3">
            How DigitalNexCare Works
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            A comprehensive guide to discovering healthcare, scheduling appointments, and managing practitioner profiles in South Africa.
          </p>
        </div>

        {/* Patient Journey */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 space-y-8">
          <div className="border-b border-slate-100 pb-4">
            <Badge variant="brand" size="sm">
              For Patients & Families
            </Badge>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">
              Finding and Accessing Healthcare
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#176BFF] font-bold flex items-center justify-center">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">Search by Needs & Location</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Filter by doctor specialty, your suburb, accepted medical aid scheme, or toggle virtual telehealth.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#176BFF] font-bold flex items-center justify-center">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">Book Instantly (Free)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Select real live time slots for verified DigitalNexCare Providers with zero booking fees or subscription mandates.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#176BFF] font-bold flex items-center justify-center">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">Unlock External Contacts</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Use your monthly 2 Free reveals (or upgrade to NexCare Access/Plus/Family) to see direct telephone and directions for external practitioners.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
