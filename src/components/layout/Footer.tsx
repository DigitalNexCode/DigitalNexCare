import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../brand/BrandLogo';
import { ShieldCheck, Heart, MapPin, Mail, Phone } from 'lucide-react';
import { SA_PROVINCES } from '../../lib/constants';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#07111F] text-slate-300 border-t border-slate-800 pb-28 sm:pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & Parent Column */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo variant="dark" size="md" showTagline />
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mt-2">
              DigitalNexCare is South Africa's leading healthcare practitioner discovery, scheduling, and provider infrastructure platform.
            </p>
            <div className="pt-2 text-xs text-slate-400">
              <span className="font-semibold text-white">Parent Company:</span> DigitalNexCode
            </div>
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-white">Market:</span> Republic of South Africa
            </div>
          </div>

          {/* Quick Discover Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#00E5D4]">
              Discover Care
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/find-care" className="hover:text-white transition-colors">
                  Find Practitioners
                </Link>
              </li>
              <li>
                <Link to="/near-me" className="hover:text-white transition-colors">
                  Practitioners Near Me
                </Link>
              </li>
              <li>
                <Link to="/specialties" className="hover:text-white transition-colors">
                  All Healthcare Specialties
                </Link>
              </li>
              <li>
                <Link to="/locations" className="hover:text-white transition-colors">
                  Browse by SA Location
                </Link>
              </li>
              <li>
                <Link to="/medical-aid" className="hover:text-white transition-colors">
                  Medical Aid Compatibility
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white transition-colors">
                  Patient Subscription Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Providers & Practice Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#176BFF]">
              For Providers & Practices
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/for-providers" className="hover:text-white transition-colors">
                  Join DigitalNexCare
                </Link>
              </li>
              <li>
                <Link to="/provider/find-existing" className="hover:text-white transition-colors">
                  Claim Existing Profile
                </Link>
              </li>
              <li>
                <Link to="/provider/verification" className="hover:text-white transition-colors">
                  HPCSA / SANC Verification
                </Link>
              </li>
              <li>
                <Link to="/for-practices" className="hover:text-white transition-colors">
                  Practice Management SaaS
                </Link>
              </li>
              <li>
                <Link to="/enterprise" className="hover:text-white transition-colors">
                  Enterprise Health Networks
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Legal & Trust
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/legal/privacy" className="hover:text-white transition-colors">
                  POPIA & Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/legal/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/legal/provider-terms" className="hover:text-white transition-colors">
                  Provider Terms
                </Link>
              </li>
              <li>
                <Link to="/legal/medical-aid-disclaimer" className="hover:text-white transition-colors">
                  Medical Aid Disclaimer
                </Link>
              </li>
              <li>
                <Link to="/accessibility" className="hover:text-white transition-colors">
                  Accessibility Commitment
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* National Coverage Banner */}
        <div className="mt-12 pt-8 border-t border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 mb-2">
            Coverage Across All 9 South African Provinces:
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {SA_PROVINCES.map((p) => (
              <Link
                key={p}
                to={`/locations/${p.toLowerCase().replace(/\s+/g, '-')}`}
                className="hover:text-white transition-colors"
              >
                {p} •
              </Link>
            ))}
          </div>
        </div>

        {/* Mandatory Medical Disclaimer */}
        <div className="mt-8 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-200">Legal Notice:</strong> DigitalNexCare is a healthcare directory, provider verification, appointment scheduling, and patient navigation technology platform. DigitalNexCare is not a hospital, doctor, medical practice, or treating medical provider. In medical emergencies, please call 112 or 10177 immediately.
        </div>

        {/* Bottom copyright */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} DigitalNexCare. A DigitalNexCode Platform. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/legal/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link to="/legal/terms" className="hover:underline">
              Terms
            </Link>
            <Link to="/help" className="hover:underline">
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
