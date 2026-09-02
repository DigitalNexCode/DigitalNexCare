import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  ShieldCheck,
  Calendar,
  Users,
  Search,
  CheckCircle2,
  Building,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const ForProvidersPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 space-y-16">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#07111F] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <Badge variant="success" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
              For Healthcare Providers & Practice Managers
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-black text-white mt-4 leading-tight">
              Grow your practice with verified digital scheduling.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
              Connect with patients searching for care across South Africa, reduce no-shows with automated SMS reminders, and offer instant verified appointment booking.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/provider/find-existing">
                <Button variant="accent" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Claim Existing Profile
                </Button>
              </Link>
              <Link to="/auth/sign-up?role=provider">
                <Button variant="outline" size="lg" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Register New Practice
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Claim Profile Workflow Explanation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            How Healthcare Providers Join DigitalNexCare
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            We follow a rigorous 3-step verification model to ensure trust and patient safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#176BFF] font-black text-lg flex items-center justify-center mb-4">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900">Find or Claim Profile</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Search our national directory for your existing practitioner record or practice name. If indexed, initiate a secure claim request.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 font-black text-lg flex items-center justify-center mb-4">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900">HPCSA / SANC Verification</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Submit your professional council registration number and practice identification for administrative verification by our compliance team.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-black text-lg flex items-center justify-center mb-4">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900">Publish Real Availability</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Configure your consultation hours, consultation fees, accepted medical aids, and receive direct confirmed bookings instantly.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
