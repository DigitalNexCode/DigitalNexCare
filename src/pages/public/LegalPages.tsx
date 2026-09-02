import React from 'react';
import { Shield, Lock, FileText, HelpCircle, CheckCircle2 } from 'lucide-react';

export const PopiaCompliancePage: React.FC = () => (
  <div className="min-h-screen bg-slate-50 py-12">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white rounded-3xl p-8 border border-slate-200 space-y-6">
      <div className="flex items-center gap-2 text-[#176BFF]">
        <Shield className="w-5 h-5" />
        <span className="text-xs font-bold uppercase tracking-wider">Compliance & Privacy</span>
      </div>
      <h1 className="text-3xl font-black text-slate-900">
        Protection of Personal Information Act (POPIA) Notice
      </h1>
      <p className="text-xs text-slate-500">Effective Date: September 2026 • Republic of South Africa</p>

      <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
        <p>
          DigitalNexCare (operated by DigitalNexCode) respects your fundamental constitutional right to privacy and is committed to processing your personal and health-related information in strict compliance with the Protection of Personal Information Act 4 of 2013 (POPIA) and the National Health Act 61 of 2003.
        </p>
        <h2 className="text-base font-bold text-slate-900 pt-3">1. Personal Information Collected</h2>
        <p>
          We collect personal identification, contact details (phone, email), appointment history, and patient-provided medical aid scheme membership numbers strictly for appointment routing and scheduling.
        </p>
        <h2 className="text-base font-bold text-slate-900 pt-3">2. Geolocation Privacy</h2>
        <p>
          Device location coordinates are queried strictly on-demand when you explicitly click "USE MY LOCATION" for discovery and are never stored for persistent tracking.
        </p>
      </div>
    </div>
  </div>
);

export const PrivacyPolicyPage: React.FC = () => <PopiaCompliancePage />;
export const LegalPrivacyPage: React.FC = () => <PopiaCompliancePage />;

export const TermsPage: React.FC = () => (
  <div className="min-h-screen bg-slate-50 py-12">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white rounded-3xl p-8 border border-slate-200 space-y-6">
      <div className="flex items-center gap-2 text-[#176BFF]">
        <FileText className="w-5 h-5" />
        <span className="text-xs font-bold uppercase tracking-wider">Legal Framework</span>
      </div>
      <h1 className="text-3xl font-black text-slate-900">Terms of Service</h1>
      <p className="text-xs text-slate-500">DigitalNexCare Marketplace Platform Terms</p>

      <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
        <p>
          DigitalNexCare provides appointment discovery, scheduling facilitation, and provider directory software infrastructure.
        </p>
        <h2 className="text-base font-bold text-slate-900 pt-3">Medical Disclaimer</h2>
        <p>
          DigitalNexCare is not a hospital, doctor, medical practice, or healthcare provider. DigitalNexCare does not provide medical diagnoses, treatment, or clinical advice.
        </p>
      </div>
    </div>
  </div>
);

export const LegalTermsPage: React.FC = () => <TermsPage />;

export const MedicalDisclaimerPage: React.FC = () => (
  <div className="min-h-screen bg-slate-50 py-12">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white rounded-3xl p-8 border border-slate-200 space-y-6">
      <div className="flex items-center gap-2 text-[#FF3D71]">
        <Shield className="w-5 h-5" />
        <span className="text-xs font-bold uppercase tracking-wider">Statutory Disclaimer</span>
      </div>
      <h1 className="text-3xl font-black text-slate-900">Medical & Emergency Disclaimer</h1>
      <p className="text-xs text-slate-500">Notice to all patients and consumers</p>

      <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
        <p className="font-bold text-slate-900 bg-red-50 p-4 rounded-xl border border-red-200">
          FOR MEDICAL EMERGENCIES, CALL 10177 OR 112 IMMEDIATELY OR VISIT YOUR NEAREST HOSPITAL CASUALTY WARD.
        </p>
        <p>
          DigitalNexCare does not provide medical consultations or emergency medical services.
        </p>
      </div>
    </div>
  </div>
);

export const HelpCenterPage: React.FC = () => (
  <div className="min-h-screen bg-slate-50 py-12">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white rounded-3xl p-8 border border-slate-200 space-y-6">
      <div className="flex items-center gap-2 text-[#176BFF]">
        <HelpCircle className="w-5 h-5" />
        <span className="text-xs font-bold uppercase tracking-wider">Support</span>
      </div>
      <h1 className="text-3xl font-black text-slate-900">Help & Support</h1>
      <p className="text-xs text-slate-500">Support for patients and healthcare providers</p>
    </div>
  </div>
);
