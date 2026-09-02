import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProviderLayout } from '../../components/layout/ProviderLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  Building,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Stethoscope,
  MapPin,
  CreditCard,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ProviderService } from '../../lib/provider/provider-service';
import { SA_PROVINCES, SA_CITIES_BY_PROVINCE, HEALTHCARE_SPECIALTIES, SA_MEDICAL_AIDS } from '../../lib/constants';
import { SouthAfricanProvince } from '../../types';

export const ProviderManualRegistrationPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('Dr.');
  const [specialty, setSpecialty] = useState(HEALTHCARE_SPECIALTIES[0]);
  const [practiceName, setPracticeName] = useState('');
  const [council, setCouncil] = useState('HPCSA');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [practiceNumber, setPracticeNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [province, setProvince] = useState<SouthAfricanProvince>('Gauteng');
  const [city, setCity] = useState('Pretoria');
  const [suburb, setSuburb] = useState('');
  const [address, setAddress] = useState('');
  const [consultationFeeZAR, setConsultationFeeZAR] = useState(700);
  const [bio, setBio] = useState('');
  const [offersVirtual, setOffersVirtual] = useState(true);
  const [offersInPerson, setOffersInPerson] = useState(true);
  const [selectedMedicalAids, setSelectedMedicalAids] = useState<string[]>([
    'Discovery Health',
    'Bonitas Medical Fund',
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const handleMedicalAidToggle = (scheme: string) => {
    setSelectedMedicalAids((prev) =>
      prev.includes(scheme) ? prev.filter((s) => s !== scheme) : [...prev, scheme]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const created = ProviderService.createManualProvider({
        userId: 'usr-provider-manual',
        fullName,
        title,
        specialty,
        practiceName,
        council,
        registrationNumber,
        practiceNumber,
        phone,
        email,
        website,
        province,
        city,
        suburb,
        address,
        consultationFeeZAR: Number(consultationFeeZAR),
        bio,
        offersVirtual,
        offersInPerson,
        acceptedMedicalAids: selectedMedicalAids,
      });

      setIsCreated(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProviderLayout
      title="Register Unindexed Healthcare Practice"
      subtitle="Complete your practice and statutory council registration to initiate compliance verification on DigitalNexCare."
    >
      <div className="space-y-6">
        {/* Anti-Fraud Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 flex items-start gap-3.5 text-xs text-blue-900">
          <ShieldCheck className="w-5 h-5 text-[#176BFF] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm text-blue-950">
              Statutory Verification Required Prior to Public Booking
            </div>
            <p className="leading-relaxed text-blue-800">
              Registering your practice creates a verified provider application. In compliance with South African health regulations, your appointment schedule will remain unbookable until statutory verification is approved by DigitalNexCare Trust Ops.
            </p>
          </div>
        </div>

        {!isCreated ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">
                1. Practitioner Identity & Council Registration
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ensure registration numbers match your statutory council certificate exactly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Professional Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                options={[
                  { value: 'Dr.', label: 'Dr. (Medical Doctor / Specialist)' },
                  { value: 'Prof.', label: 'Prof. (Professor)' },
                  { value: 'Mr.', label: 'Mr. (Physiotherapist / Allied)' },
                  { value: 'Ms.', label: 'Ms. (Allied Health)' },
                  { value: 'Sr.', label: 'Sr. (Sister / Registered Nurse)' },
                ]}
              />

              <div className="sm:col-span-2">
                <Input
                  label="Full Legal Practitioner Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Naledi Mokoena"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Statutory Professional Council"
                value={council}
                onChange={(e) => setCouncil(e.target.value)}
                options={[
                  { value: 'HPCSA', label: 'HPCSA (Health Professions Council of SA)' },
                  { value: 'SADA', label: 'SADA (SA Dental Association)' },
                  { value: 'SANC', label: 'SANC (SA Nursing Council)' },
                  { value: 'SAPC', label: 'SAPC (SA Pharmacy Council)' },
                  { value: 'AHPCSA', label: 'AHPCSA (Allied Health Council)' },
                ]}
              />

              <Input
                label="Council Registration Number"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="e.g. MP 0784920 / DP 0498112"
                required
              />

              <Input
                label="BHF Practice Number (PCNS)"
                value={practiceNumber}
                onChange={(e) => setPracticeNumber(e.target.value)}
                placeholder="e.g. 0145892"
                required
              />
            </div>

            <div className="border-b border-slate-100 pb-4 pt-4">
              <h3 className="text-base font-bold text-slate-900">
                2. Clinical Specialty & Practice Facility
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Primary Specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                options={HEALTHCARE_SPECIALTIES.map((s) => ({ value: s, label: s }))}
              />

              <Input
                label="Practice / Rooms Name"
                value={practiceName}
                onChange={(e) => setPracticeName(e.target.value)}
                placeholder="e.g. Hatfield Family Medical Centre"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Official Practice Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+27 12 362 5590"
                required
              />

              <Input
                label="Official Practice Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reception@practice.co.za"
                required
              />

              <Input
                label="Practice Website (Optional)"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://practice.co.za"
              />
            </div>

            <div className="border-b border-slate-100 pb-4 pt-4">
              <h3 className="text-base font-bold text-slate-900">
                3. Physical Practice Location (South Africa)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Province"
                value={province}
                onChange={(e) => {
                  const prov = e.target.value as SouthAfricanProvince;
                  setProvince(prov);
                  setCity(SA_CITIES_BY_PROVINCE[prov]?.[0] || '');
                }}
                options={SA_PROVINCES.map((p) => ({ value: p, label: p }))}
              />

              <Select
                label="City / Town"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                options={(SA_CITIES_BY_PROVINCE[province] || []).map((c) => ({ value: c, label: c }))}
              />

              <Input
                label="Suburb"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                placeholder="e.g. Hatfield / Faerie Glen"
                required
              />
            </div>

            <Input
              label="Full Physical Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 422 Burnett Street, Hatfield, Pretoria, 0028"
              required
            />

            <div className="border-b border-slate-100 pb-4 pt-4">
              <h3 className="text-base font-bold text-slate-900">
                4. Consultation Rates & Medical Aid Acceptance
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Base Consultation Fee (ZAR)"
                type="number"
                value={consultationFeeZAR}
                onChange={(e) => setConsultationFeeZAR(Number(e.target.value))}
                required
              />

              <div className="sm:col-span-2 flex items-center gap-6 pt-7 text-xs font-semibold text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={offersInPerson}
                    onChange={(e) => setOffersInPerson(e.target.checked)}
                    className="rounded-sm border-slate-300 text-[#176BFF] focus:ring-[#176BFF]"
                  />
                  <span>Offers In-Person Consultations</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={offersVirtual}
                    onChange={(e) => setOffersVirtual(e.target.checked)}
                    className="rounded-sm border-slate-300 text-[#176BFF] focus:ring-[#176BFF]"
                  />
                  <span>Offers Virtual / Telehealth Consultations</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Accepted South African Medical Aid Schemes
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SA_MEDICAL_AIDS.slice(0, 9).map((aid) => {
                  const isSelected = selectedMedicalAids.includes(aid);
                  return (
                    <button
                      type="button"
                      key={aid}
                      onClick={() => handleMedicalAidToggle(aid)}
                      className={`text-left px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300 text-[#176BFF] font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '} {aid}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
              <Link to="/provider/find-existing">
                <Button type="button" variant="outline">
                  Back to Search
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Register Practice & Proceed to Verification
              </Button>
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">
                Practice Registered Successfully!
              </h2>
              <p className="text-sm text-slate-600 max-w-lg mx-auto">
                Your practice record for <strong>{fullName} ({practiceName})</strong> has been saved with status <strong>SUBMITTED</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-xs text-left text-slate-600 space-y-1">
              <div>Registration Number: <strong className="text-slate-900">{registrationNumber}</strong></div>
              <div>BHF Practice Number: <strong className="text-slate-900">{practiceNumber}</strong></div>
              <div>Authority: <strong className="text-slate-900">PRACTITIONER_CONFIRMED (Awaiting Trust Ops)</strong></div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Link to="/provider/verification">
                <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Upload Verification Documents Now
                </Button>
              </Link>
              <Link to="/provider/dashboard">
                <Button variant="outline">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </ProviderLayout>
  );
};
